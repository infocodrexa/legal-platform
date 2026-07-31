const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const backupService = require("../services/backup.service");

const trigger = asyncHandler(async (req, res) => {
  const record = await backupService.trigger({ adminUserId: req.user.id });
  sendSuccess(res, { statusCode: 201, message: `Backup ${record.status.toLowerCase()}.`, data: record });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await backupService.list({ page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const download = asyncHandler(async (req, res) => {
  const url = await backupService.getDownloadUrl({ backupRecordId: req.params.backupId, adminUserId: req.user.id });
  if (!url) throw new ApiError(404, "Backup download URL not available");
  sendSuccess(res, { data: { url } });
});

const requestRestore = asyncHandler(async (req, res) => {
  const result = await backupService.requestRestore({
    backupRecordId: req.params.backupId,
    adminUserId: req.user.id,
    reason: req.body.reason,
  });
  sendSuccess(res, { message: result.message, data: result });
});

module.exports = { trigger, list, download, requestRestore };
