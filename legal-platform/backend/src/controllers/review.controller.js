const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const reviewService = require("../services/review.service");

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview({
    userId: req.user.id,
    appointmentId: req.body.appointmentId,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  sendSuccess(res, { statusCode: 201, message: "Review submitted.", data: review });
});

const listForLawyer = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await reviewService.listReviewsForLawyer({
    lawyerProfileId: req.params.lawyerProfileId,
    page,
    limit,
  });
  sendSuccess(res, {
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit, averageRating: result.averageRating },
  });
});

const moderate = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview({
    reviewId: req.params.reviewId,
    isPublished: req.body.isPublished,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { message: `Review ${review.isPublished ? "published" : "unpublished"}.`, data: review });
});

const listAll = asyncHandler(async (req, res) => {
  const { isPublished, page, limit } = req.query;
  const result = await reviewService.listAllReviews({ isPublished, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listMine = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await reviewService.listMine({ userId: req.user.id, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { create, listForLawyer, moderate, listAll, listMine };
