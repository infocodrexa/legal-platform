const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const mediaService = require("../services/media.service");

const list = asyncHandler(async (req, res) => {
  const { usageContext, page, limit } = req.query;
  const result = await mediaService.list({ usageContext, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const getOne = asyncHandler(async (req, res) => {
  const asset = await mediaService.getById(req.params.mediaAssetId);
  sendSuccess(res, { data: asset });
});

const remove = asyncHandler(async (req, res) => {
  await mediaService.remove(req.params.mediaAssetId);
  sendSuccess(res, { message: "Media asset removed from the library." });
});

const contexts = asyncHandler(async (req, res) => {
  const data = await mediaService.usageContexts();
  sendSuccess(res, { data });
});

module.exports = { list, getOne, remove, contexts };
