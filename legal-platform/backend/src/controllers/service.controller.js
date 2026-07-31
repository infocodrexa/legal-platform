const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const serviceService = require("../services/service.service");

const create = asyncHandler(async (req, res) => {
  const service = await serviceService.create({ data: req.body, coverImageFile: req.file, adminUserId: req.user.id });
  sendSuccess(res, { statusCode: 201, message: "Service created.", data: service });
});

const update = asyncHandler(async (req, res) => {
  const service = await serviceService.update({
    serviceId: req.params.serviceId,
    data: req.body,
    coverImageFile: req.file,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { message: "Service updated.", data: service });
});

const remove = asyncHandler(async (req, res) => {
  await serviceService.remove(req.params.serviceId);
  sendSuccess(res, { message: "Service deleted." });
});

const getBySlug = asyncHandler(async (req, res) => {
  const service = await serviceService.getPublishedBySlug(req.params.slug);
  sendSuccess(res, { data: service });
});

const getByIdAdmin = asyncHandler(async (req, res) => {
  const service = await serviceService.getByIdForAdmin(req.params.serviceId);
  sendSuccess(res, { data: service });
});

const listPublished = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await serviceService.listPublished({ page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listAllAdmin = asyncHandler(async (req, res) => {
  const { isPublished, page, limit } = req.query;
  const result = await serviceService.listAllForAdmin({ isPublished, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { create, update, remove, getBySlug, getByIdAdmin, listPublished, listAllAdmin };
