const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { getRazorpay } = require("../config/razorpay");
const { writeAuditLog } = require("../utils/auditLog");
const notificationService = require("./notification.service");

const REFUNDABLE_PAYMENT_STATUSES = new Set(["CAPTURED", "SETTLED"]);

async function requestRefund({ userId, paymentId, amount, reason }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { appointment: true, user: true },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.userId !== userId) throw new ApiError(403, "This payment does not belong to you");
  if (!REFUNDABLE_PAYMENT_STATUSES.has(payment.status)) {
    throw new ApiError(409, `Payment with status ${payment.status} is not refundable`);
  }
  // Refunds are only meaningful once the consultation itself won't happen —
  // require the appointment to be CANCELLED first.
  if (payment.appointment.status !== "CANCELLED") {
    throw new ApiError(409, "Refunds can only be requested for a cancelled appointment");
  }

  const existingOpen = await prisma.refund.findFirst({
    where: { paymentId, status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
  });
  if (existingOpen) throw new ApiError(409, "A refund is already in progress for this payment");

  const refundAmount = amount ? Number(amount) : Number(payment.amount);
  if (refundAmount > Number(payment.amount)) {
    throw new ApiError(400, "Refund amount cannot exceed the original payment amount");
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refund.create({
      data: { paymentId, amount: refundAmount, reason: reason || null, requestedByUserId: userId },
    });
    await writeAuditLog(tx, {
      actorUserId: userId,
      actorRole: "USER",
      action: "REFUND_REQUESTED",
      entityType: "Refund",
      entityId: created.id,
      metadata: { paymentId, amount: refundAmount },
    });
    return created;
  });

  notificationService
    .notify({
      user: payment.user,
      type: "REFUND_REQUESTED",
      data: { amount: refundAmount, currency: payment.currency },
      channels: ["EMAIL"],
    })
    .catch((err) => console.error(`[refund] notify failed for ${refund.id}:`, err.message));

  return refund;
}

async function approveRefund({ refundId, adminUserId }) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({ where: { id: refundId } });
    if (!refund) throw new ApiError(404, "Refund not found");
    if (refund.status !== "REQUESTED") {
      throw new ApiError(409, `Refund is not awaiting approval (status: ${refund.status})`);
    }

    const updated = await tx.refund.update({
      where: { id: refundId },
      data: { status: "APPROVED", approvedByUserId: adminUserId },
    });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "REFUND_APPROVED",
      entityType: "Refund",
      entityId: refund.id,
    });
    return updated;
  });
}

async function rejectRefund({ refundId, adminUserId, rejectionReason }) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({ where: { id: refundId } });
    if (!refund) throw new ApiError(404, "Refund not found");
    if (refund.status !== "REQUESTED") {
      throw new ApiError(409, `Refund is not awaiting a decision (status: ${refund.status})`);
    }

    const updated = await tx.refund.update({
      where: { id: refundId },
      data: { status: "REJECTED", approvedByUserId: adminUserId, rejectionReason },
    });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "REFUND_REJECTED",
      entityType: "Refund",
      entityId: refund.id,
      metadata: { rejectionReason },
    });
    return updated;
  });
}

// Actually calls Razorpay to process the refund. Split into its own step
// (rather than folded into approve) so an approved-but-not-yet-processed
// state is visible and retryable if the Razorpay call fails transiently.
async function processRefund({ refundId, adminUserId }) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { payment: { include: { user: true } } },
  });
  if (!refund) throw new ApiError(404, "Refund not found");
  if (refund.status !== "APPROVED") {
    throw new ApiError(409, `Refund must be APPROVED before processing (status: ${refund.status})`);
  }
  if (!refund.payment.razorpayPaymentId) {
    throw new ApiError(409, "Underlying payment has no captured Razorpay payment to refund");
  }

  await prisma.refund.update({ where: { id: refundId }, data: { status: "PROCESSING" } });

  try {
    const razorpay = getRazorpay();
    const razorpayRefund = await razorpay.payments.refund(refund.payment.razorpayPaymentId, {
      amount: Math.round(Number(refund.amount) * 100),
    });

    const processed = await prisma.$transaction(async (tx) => {
      const updated = await tx.refund.update({
        where: { id: refundId },
        data: { status: "PROCESSED", razorpayRefundId: razorpayRefund.id, processedAt: new Date() },
      });
      await tx.payment.update({ where: { id: refund.paymentId }, data: { status: "REFUNDED" } });
      await writeAuditLog(tx, {
        actorUserId: adminUserId,
        actorRole: "ADMIN",
        action: "REFUND_PROCESSED",
        entityType: "Refund",
        entityId: refund.id,
        metadata: { razorpayRefundId: razorpayRefund.id },
      });
      return updated;
    });

    notificationService
      .notify({
        user: refund.payment.user,
        type: "REFUND_PROCESSED",
        data: { amount: refund.amount, currency: refund.payment.currency },
        channels: ["EMAIL", "WHATSAPP"],
      })
      .catch((err) => console.error(`[refund] notify failed for ${refund.id}:`, err.message));

    return processed;
  } catch (err) {
    await prisma.$transaction(async (tx) => {
      await tx.refund.update({ where: { id: refundId }, data: { status: "FAILED" } });
      await writeAuditLog(tx, {
        actorUserId: adminUserId,
        actorRole: "ADMIN",
        action: "REFUND_PROCESSING_FAILED",
        entityType: "Refund",
        entityId: refund.id,
        metadata: { error: err.message },
      });
    });
    throw new ApiError(502, "Refund could not be processed by the payment gateway");
  }
}

async function getRefundForActor({ refundId, actorUserId, actorRole }) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { payment: { include: { lawyerProfile: { select: { userId: true } } } } },
  });
  if (!refund) throw new ApiError(404, "Refund not found");

  const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(actorRole);
  const isBuyer = refund.requestedByUserId === actorUserId;
  if (!isPrivileged && !isBuyer) throw new ApiError(403, "You do not have access to this refund");

  return refund;
}

async function listRefunds({ status, page, limit }) {
  const where = { ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      orderBy: { requestedAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { requestedByUser: { select: { id: true, name: true, email: true } } },
    }),
    prisma.refund.count({ where }),
  ]);
  return { items, total, page, limit };
}

module.exports = { requestRefund, approveRefund, rejectRefund, processRefund, getRefundForActor, listRefunds };
