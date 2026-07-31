const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const templateService = require("../services/messageTemplate.service");

const upsert = asyncHandler(async (req, res) => {
  const template = await templateService.upsert({ ...req.body, adminUserId: req.user.id });
  sendSuccess(res, { statusCode: 201, message: "Message template saved.", data: template });
});

const list = asyncHandler(async (req, res) => {
  const { type, channel, page, limit } = req.query;
  const result = await templateService.list({ type, channel, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const remove = asyncHandler(async (req, res) => {
  await templateService.remove(req.params.templateId);
  sendSuccess(res, { message: "Message template deleted." });
});

const preview = asyncHandler(async (req, res) => {
  const rendered = await templateService.preview({
    type: req.body.type,
    channel: req.body.channel,
    sampleData: req.body.sampleData,
  });
  sendSuccess(res, { data: rendered });
});

module.exports = { upsert, list, remove, preview };
