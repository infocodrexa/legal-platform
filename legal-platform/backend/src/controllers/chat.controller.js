const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const chatService = require("../services/chat.service");
const { uploadPrivateObject, getSignedDownloadUrl } = require("../utils/s3");

// Uploads the file and hands back a key the client then sends over the
// socket in a chat:message event — keeps the (potentially slow) upload off
// the socket connection and reuses the same private-S3 convention as
// documents/KYC/invoices.
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file was uploaded");
  await chatService.assertParticipant(req.params.appointmentId, req.user.id);

  const key = await uploadPrivateObject({
    prefix: "chat",
    userId: req.user.id,
    originalFileName: req.file.originalname,
    mimeType: req.file.mimetype,
    buffer: req.file.buffer,
  });
  const previewUrl = await getSignedDownloadUrl(key);

  sendSuccess(res, {
    statusCode: 201,
    message: "Attachment uploaded.",
    data: {
      attachmentKey: key,
      attachmentFileName: req.file.originalname,
      attachmentMimeType: req.file.mimetype,
      previewUrl,
    },
  });
});

const listHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await chatService.listMessages({
    appointmentId: req.params.appointmentId,
    actorUserId: req.user.id,
    page,
    limit,
  });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { uploadAttachment, listHistory };
