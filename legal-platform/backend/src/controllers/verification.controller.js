const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const verificationService = require("../services/verification.service");

const listQueue = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await verificationService.listReviewQueue({ status, page, limit });
  sendSuccess(res, {
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const document = await verificationService.getDocumentForReview(req.params.documentId);
  sendSuccess(res, { data: document });
});

const startReview = asyncHandler(async (req, res) => {
  const document = await verificationService.startReview({
    documentId: req.params.documentId,
    reviewerUserId: req.user.id,
  });
  sendSuccess(res, { message: "Review started.", data: document });
});

const decide = asyncHandler(async (req, res) => {
  const document = await verificationService.decideDocument({
    documentId: req.params.documentId,
    reviewerUserId: req.user.id,
    status: req.body.status,
    remarks: req.body.remarks,
  });
  sendSuccess(res, { message: `Document marked ${document.status}.`, data: document });
});

module.exports = { listQueue, getOne, startReview, decide };
