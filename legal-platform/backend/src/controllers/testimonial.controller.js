const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const testimonialService = require("../services/testimonial.service");

const create = asyncHandler(async (req, res) => {
  const testimonial = await testimonialService.create({
    data: req.body,
    avatarFile: req.file,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { statusCode: 201, message: "Testimonial created.", data: testimonial });
});

const update = asyncHandler(async (req, res) => {
  const testimonial = await testimonialService.update({
    testimonialId: req.params.testimonialId,
    data: req.body,
    avatarFile: req.file,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { message: "Testimonial updated.", data: testimonial });
});

const remove = asyncHandler(async (req, res) => {
  await testimonialService.remove(req.params.testimonialId);
  sendSuccess(res, { message: "Testimonial deleted." });
});

const listPublic = asyncHandler(async (req, res) => {
  const testimonials = await testimonialService.listPublic();
  sendSuccess(res, { data: testimonials });
});

const listAllAdmin = asyncHandler(async (req, res) => {
  const { isPublished, page, limit } = req.query;
  const result = await testimonialService.listAllForAdmin({ isPublished, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { create, update, remove, listPublic, listAllAdmin };
