const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const env = require("../config/env");
const paymentService = require("../services/payment.service");

const createOrder = asyncHandler(async (req, res) => {
  const { order, payment } = await paymentService.createOrderForAppointment({
    userId: req.user.id,
    appointmentId: req.body.appointmentId,
    buyerGstin: req.body.buyerGstin,
  });
  sendSuccess(res, {
    statusCode: 201,
    message: "Order created.",
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: "INR",
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
    },
  });
});

const confirmCheckout = asyncHandler(async (req, res) => {
  const payment = await paymentService.confirmCheckout({
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    razorpaySignature: req.body.razorpaySignature,
    actorUserId: req.user.id,
  });
  sendSuccess(res, { message: `Payment ${payment.status.toLowerCase()}.`, data: payment });
});

// Raw-body route — see app.js for the express.raw() wiring on this path.
// Rejects unsigned/invalid webhooks per spec Sec 8.
const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const isValid = paymentService.verifyWebhookSignature(req.body, signature);
  if (!isValid) throw new ApiError(400, "Invalid webhook signature");

  const event = JSON.parse(req.body.toString("utf8"));
  await paymentService.processWebhookEvent(event);

  res.status(200).json({ success: true });
});

const getOne = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentForActor({
    paymentId: req.params.paymentId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
  });
  sendSuccess(res, { data: payment });
});

const listMine = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await paymentService.listPaymentsForUser({ userId: req.user.id, status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listLawyerMine = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await paymentService.listPaymentsForLawyer({ userId: req.user.id, status, page, limit });
  sendSuccess(res, {
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit, totalEarnings: result.totalEarnings },
  });
});

module.exports = { createOrder, confirmCheckout, webhook, getOne, listMine, listLawyerMine };
