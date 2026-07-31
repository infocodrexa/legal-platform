const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const faqService = require("../services/faq.service");

const create = asyncHandler(async (req, res) => {
  const faq = await faqService.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "FAQ created.", data: faq });
});

const update = asyncHandler(async (req, res) => {
  const faq = await faqService.update(req.params.faqId, req.body);
  sendSuccess(res, { message: "FAQ updated.", data: faq });
});

const remove = asyncHandler(async (req, res) => {
  await faqService.remove(req.params.faqId);
  sendSuccess(res, { message: "FAQ deleted." });
});

const listPublic = asyncHandler(async (req, res) => {
  const faqs = await faqService.listPublic({ category: req.query.category });
  sendSuccess(res, { data: faqs });
});

const listAllAdmin = asyncHandler(async (req, res) => {
  const { category, isPublished, page, limit } = req.query;
  const result = await faqService.listAllForAdmin({ category, isPublished, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { create, update, remove, listPublic, listAllAdmin };
