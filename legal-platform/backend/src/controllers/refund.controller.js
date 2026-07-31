const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const refundService = require("../services/refund.service");

const request = asyncHandler(async (req, res) => {
  const refund = await refundService.requestRefund({
    userId: req.user.id,
    paymentId: req.body.paymentId,
    amount: req.body.amount,
    reason: req.body.reason,
  });
  sendSuccess(res, { statusCode: 201, message: "Refund requested.", data: refund });
});

const approve = asyncHandler(async (req, res) => {
  const refund = await refundService.approveRefund({ refundId: req.params.refundId, adminUserId: req.user.id });
  sendSuccess(res, { message: "Refund approved.", data: refund });
});

const reject = asyncHandler(async (req, res) => {
  const refund = await refundService.rejectRefund({
    refundId: req.params.refundId,
    adminUserId: req.user.id,
    rejectionReason: req.body.rejectionReason,
  });
  sendSuccess(res, { message: "Refund rejected.", data: refund });
});

const process_ = asyncHandler(async (req, res) => {
  const refund = await refundService.processRefund({ refundId: req.params.refundId, adminUserId: req.user.id });
  sendSuccess(res, { message: "Refund processed.", data: refund });
});

const getOne = asyncHandler(async (req, res) => {
  const refund = await refundService.getRefundForActor({
    refundId: req.params.refundId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
  });
  sendSuccess(res, { data: refund });
});

const listAll = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await refundService.listRefunds({ status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { request, approve, reject, process: process_, getOne, listAll };
