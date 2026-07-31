const crypto = require("crypto");
const prisma = require("../config/db");
const env = require("../config/env");
const { ApiError } = require("../utils/apiResponse");
const { getRazorpay } = require("../config/razorpay");
const { getSignedDownloadUrl } = require("../utils/s3");
const { generateAndStoreInvoice } = require("../utils/invoice");
const { writeAuditLog } = require("../utils/auditLog");
const notificationService = require("./notification.service");
const lawyerService = require("./lawyer.service");

// Rounds to 2dp the way currency math should — avoids the classic
// commission + payout !== amount off-by-a-paisa bug from floating point.
function computeSplit(amount) {
  const commission = Math.round(amount * env.PLATFORM_COMMISSION_PERCENT) / 100;
  const payout = Math.round((amount - commission) * 100) / 100;
  return { platformCommission: commission, lawyerPayout: payout };
}

// Idempotent: if a CREATED order already exists for this appointment, it is
// returned as-is rather than creating a duplicate Razorpay order (spec Sec 8
// — every payment endpoint must be safe to retry).
async function createOrderForAppointment({ userId, appointmentId, buyerGstin }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { lawyerProfile: true },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.userId !== userId) throw new ApiError(403, "This appointment does not belong to you");
  if (appointment.status !== "ACCEPTED") {
    throw new ApiError(409, `Appointment must be ACCEPTED before payment (status: ${appointment.status})`);
  }

  const existing = await prisma.payment.findUnique({ where: { appointmentId } });
  if (existing) {
    if (existing.status !== "CREATED") {
      throw new ApiError(409, `Payment already ${existing.status.toLowerCase()} for this appointment`);
    }
    return { order: { id: existing.razorpayOrderId, amount: Math.round(Number(existing.amount) * 100) }, payment: existing };
  }

  const amount = Number(appointment.consultationCharge);
  const { platformCommission, lawyerPayout } = computeSplit(amount);

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    receipt: appointmentId,
    notes: { appointmentId, userId, lawyerId: appointment.lawyerId },
  });

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        userId,
        lawyerId: appointment.lawyerId,
        appointmentId,
        razorpayOrderId: order.id,
        amount,
        platformCommission,
        lawyerPayout,
        buyerGstin: buyerGstin || null,
        status: "CREATED",
      },
    });
    await writeAuditLog(tx, {
      actorUserId: userId,
      actorRole: "USER",
      action: "PAYMENT_ORDER_CREATED",
      entityType: "Payment",
      entityId: created.id,
      metadata: { razorpayOrderId: order.id, amount },
    });
    return created;
  });

  return { order, payment };
}

// Verifies the checkout-success callback signature: HMAC-SHA256 of
// "order_id|payment_id" using the key secret. This is the client-side
// confirmation; the webhook (below) remains the source of truth since it
// can't be spoofed by a compromised frontend.
function verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, razorpaySignature);
}

// Verifies X-Razorpay-Signature on the raw webhook body against the
// configured webhook secret. Unsigned/invalid webhooks must be rejected
// per spec Sec 8.
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqualHex(expected, signatureHeader);
}

function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(String(b || ""), "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Attempts a Razorpay Route transfer of the lawyer's payout share directly
// to their linked account (spec Sec 2.1 — no indefinite pooling). If the
// lawyer has no linked account yet, settlement is skipped and the payment
// stays CAPTURED for manual/admin settlement later; this never blocks the
// capture flow itself.
async function attemptSettlement(tx, payment, lawyerProfile) {
  if (!lawyerProfile.razorpayAccountId) {
    console.warn(`[payment] no linked account for lawyer ${lawyerProfile.id}; settlement deferred`);
    return null;
  }

  try {
    const razorpay = getRazorpay();
    const linkedAccountId = lawyerService.decryptRazorpayAccountId(lawyerProfile);
    const transfer = await razorpay.payments.transfer(payment.razorpayPaymentId, {
      transfers: [
        {
          account: linkedAccountId,
          amount: Math.round(Number(payment.lawyerPayout) * 100),
          currency: "INR",
          on_hold: 0,
        },
      ],
    });
    const transferId = transfer.items?.[0]?.id || transfer.id;

    const settled = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "SETTLED", settledAt: new Date(), razorpayTransferId: transferId },
    });
    await writeAuditLog(tx, {
      action: "PAYMENT_SETTLED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { razorpayTransferId: transferId, lawyerPayout: payment.lawyerPayout },
    });
    return settled;
  } catch (err) {
    console.error(`[payment] settlement failed for payment ${payment.id}:`, err.message);
    await writeAuditLog(tx, {
      action: "PAYMENT_SETTLEMENT_FAILED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { error: err.message },
    });
    return null; // stays CAPTURED — retried later via an admin/ops job
  }
}

// Central webhook dispatcher. Every branch is idempotent: re-delivery of
// the same event (Razorpay retries on non-2xx) must not double-process.
async function processWebhookEvent(event) {
  const type = event?.event;

  if (type === "payment.captured") {
    await handlePaymentCaptured(event.payload.payment.entity);
  } else if (type === "payment.failed") {
    await handlePaymentFailed(event.payload.payment.entity);
  } else if (type === "refund.processed") {
    await handleRefundProcessed(event.payload.refund.entity);
  } else {
    console.log(`[payment] ignoring unhandled webhook event: ${type}`);
  }
}

async function handlePaymentCaptured(paymentEntity) {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: paymentEntity.order_id },
    include: { lawyerProfile: true, user: true, appointment: true },
  });
  if (!payment) {
    console.error(`[payment] webhook for unknown order ${paymentEntity.order_id}`);
    return; // ack the webhook regardless — nothing to retry against
  }
  if (payment.status !== "CREATED") {
    return; // already processed — idempotent no-op
  }

  const captured = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: paymentEntity.id,
        capturedAt: new Date(),
      },
    });
    await writeAuditLog(tx, {
      actorUserId: payment.userId,
      actorRole: "USER",
      action: "PAYMENT_CAPTURED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { razorpayPaymentId: paymentEntity.id, amount: payment.amount },
    });
    await attemptSettlement(tx, updatedPayment, payment.lawyerProfile);
    return updatedPayment;
  });

  try {
    const lawyerUser = await prisma.user.findUnique({ where: { id: payment.lawyerProfile.userId } });
    const invoiceKey = await generateAndStoreInvoice({
      payment: captured,
      user: payment.user,
      lawyerProfile: payment.lawyerProfile,
      lawyerUser,
      appointment: payment.appointment,
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { gstInvoiceKey: invoiceKey } });
  } catch (err) {
    console.error(`[payment] invoice generation failed for payment ${payment.id}:`, err.message);
  }

  await notificationService
    .notify({
      user: payment.user,
      type: "PAYMENT_CAPTURED",
      data: { amount: payment.amount, currency: payment.currency },
      channels: ["EMAIL", "WHATSAPP"],
    })
    .catch((err) => console.error("[payment] receipt notification failed:", err.message));
}

async function handlePaymentFailed(paymentEntity) {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: paymentEntity.order_id },
    include: { user: true },
  });
  if (!payment || payment.status !== "CREATED") return; // unknown or already resolved

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await writeAuditLog(tx, {
      action: "PAYMENT_FAILED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { reason: paymentEntity.error_description || null },
    });
  });

  await notificationService
    .notify({
      user: payment.user,
      type: "PAYMENT_FAILED",
      data: { amount: payment.amount, currency: payment.currency },
      channels: ["EMAIL"],
    })
    .catch((err) => console.error("[payment] failure notification failed:", err.message));
}

// Keeps Refund rows in sync if Razorpay's own refund lifecycle completes
// asynchronously after our processRefund() call already moved it to
// PROCESSING (see refund.service.js).
async function handleRefundProcessed(refundEntity) {
  const refund = await prisma.refund.findFirst({ where: { razorpayRefundId: refundEntity.id } });
  if (!refund || refund.status === "PROCESSED") return;

  await prisma.$transaction(async (tx) => {
    await tx.refund.update({ where: { id: refund.id }, data: { status: "PROCESSED", processedAt: new Date() } });
    await writeAuditLog(tx, {
      action: "REFUND_PROCESSED",
      entityType: "Refund",
      entityId: refund.id,
      metadata: { razorpayRefundId: refundEntity.id },
    });
  });
}

async function getPaymentForActor({ paymentId, actorUserId, actorRole }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { lawyerProfile: { select: { userId: true } } },
  });
  if (!payment) throw new ApiError(404, "Payment not found");

  const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(actorRole);
  const isBuyer = payment.userId === actorUserId;
  const isLawyer = payment.lawyerProfile.userId === actorUserId;
  if (!isPrivileged && !isBuyer && !isLawyer) {
    throw new ApiError(403, "You do not have access to this payment");
  }

  const invoiceUrl = payment.gstInvoiceKey ? await getSignedDownloadUrl(payment.gstInvoiceKey) : null;
  return { ...payment, invoiceUrl };
}

async function listPaymentsForUser({ userId, status, page, limit }) {
  const where = { userId, ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.payment.count({ where }),
  ]);
  return { items, total, page, limit };
}

// Payments *received* by a lawyer (Payment.lawyerId), not payments a user
// made (Payment.userId) — a distinct query, not a filter on the function
// above. Completes the Lawyer Dashboard's existing Earnings page.
async function listPaymentsForLawyer({ userId, status, page, limit }) {
  const profile = await lawyerService.getProfileByUserId(userId);
  const where = { lawyerId: profile.id, ...(status && { status }) };
  const [items, total, aggregate] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { lawyerId: profile.id, status: { in: ["CAPTURED", "SETTLED"] } },
      _sum: { lawyerPayout: true },
    }),
  ]);
  return { items, total, page, limit, totalEarnings: aggregate._sum.lawyerPayout || 0 };
}

// Client-side checkout success callback. Verifies the signature, then
// idempotently runs the same capture handling the webhook would — this
// gives the frontend an immediate result without waiting on webhook
// delivery, while the webhook remains the authoritative retry path if this
// call never happens (e.g. user closes the tab mid-checkout).
async function confirmCheckout({ razorpayOrderId, razorpayPaymentId, razorpaySignature, actorUserId }) {
  const isValid = verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!isValid) throw new ApiError(400, "Invalid payment signature");

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment) throw new ApiError(404, "Payment not found for this order");
  if (payment.userId !== actorUserId) throw new ApiError(403, "This payment does not belong to you");

  await handlePaymentCaptured({ order_id: razorpayOrderId, id: razorpayPaymentId });

  return prisma.payment.findUnique({ where: { razorpayOrderId } });
}

module.exports = {
  computeSplit,
  createOrderForAppointment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  processWebhookEvent,
  confirmCheckout,
  getPaymentForActor,
  listPaymentsForUser,
  listPaymentsForLawyer,
};
