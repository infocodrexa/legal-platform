// const asyncHandler = require("../utils/asyncHandler");
// const { sendSuccess } = require("../utils/apiResponse");
// const notificationService = require("../services/notification.service");

// const listMine = asyncHandler(async (req, res) => {
//   const { status, isRead, page, limit } = req.query;
//   const result = await notificationService.listForUser({ userId: req.user.id, status, isRead, page, limit });
//   sendSuccess(res, { data: result.items, meta: { total: result.total, unreadCount: result.unreadCount, page, limit } });
// });
// const markRead = asyncHandler(async (req, res) => {
//   const data = await notificationService.markRead({ userId: req.user.id, notificationId: req.params.notificationId });
//   sendSuccess(res, { message: "Notification marked as read.", data });
// });
// const markAllRead = asyncHandler(async (req, res) => {
//   const data = await notificationService.markAllRead(req.user.id);
//   sendSuccess(res, { message: "All notifications marked as read.", data });
// });
// const getPreferences = asyncHandler(async (req, res) => {
//   const data = await notificationService.getPreferences(req.user.id);
//   sendSuccess(res, { data });
// });
// const updatePreferences = asyncHandler(async (req, res) => {
//   const data = await notificationService.updatePreferences(req.user.id, req.body);
//   sendSuccess(res, { message: "Notification preferences updated.", data });
// });
// const adminSend = asyncHandler(async (req, res) => {
//   const data = await notificationService.sendAdminNotification({ adminUserId: req.user.id, ...req.body });
//   sendSuccess(res, { statusCode: 201, message: "Notification queued successfully.", data });
// });
// module.exports = { listMine, markRead, markAllRead, getPreferences, updatePreferences, adminSend };



const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");

const listMine = asyncHandler(async (req, res) => {
  const {
    status,
    isRead,
    page = 1,
    limit = 12,
  } = req.query;

  const result = await notificationService.listForUser({
    userId: req.user.id,
    status,
    isRead,
    page,
    limit,
  });

  sendSuccess(res, {
    data: result.items,
    meta: {
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
    },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markRead({
    userId: req.user.id,
    notificationId: req.params.notificationId,
  });

  sendSuccess(res, {
    message: "Notification marked as read.",
    data,
  });
});

const markUnread = asyncHandler(async (req, res) => {
  const data = await notificationService.markUnread({
    userId: req.user.id,
    notificationId: req.params.notificationId,
  });

  sendSuccess(res, {
    message: "Notification marked as unread.",
    data,
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllRead(
    req.user.id
  );

  sendSuccess(res, {
    message: "All notifications marked as read.",
    data,
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const data = await notificationService.deleteNotification({
    userId: req.user.id,
    notificationId: req.params.notificationId,
  });

  sendSuccess(res, {
    message: "Notification deleted successfully.",
    data,
  });
});

const deleteAllMine = asyncHandler(async (req, res) => {
  const data = await notificationService.deleteAllForUser(
    req.user.id
  );

  sendSuccess(res, {
    message: "All notifications deleted successfully.",
    data,
  });
});

const deleteReadMine = asyncHandler(async (req, res) => {
  const data = await notificationService.deleteReadForUser(
    req.user.id
  );

  sendSuccess(res, {
    message: "Read notifications deleted successfully.",
    data,
  });
});

const getPreferences = asyncHandler(async (req, res) => {
  const data = await notificationService.getPreferences(
    req.user.id
  );

  sendSuccess(res, {
    data,
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const data = await notificationService.updatePreferences(
    req.user.id,
    req.body
  );

  sendSuccess(res, {
    message: "Notification preferences updated.",
    data,
  });
});

const adminSend = asyncHandler(async (req, res) => {
  const data =
    await notificationService.sendAdminNotification({
      adminUserId: req.user.id,
      ...req.body,
    });

  sendSuccess(res, {
    statusCode: 201,
    message: "Notification queued successfully.",
    data,
  });
});

module.exports = {
  listMine,
  markRead,
  markUnread,
  markAllRead,
  deleteNotification,
  deleteAllMine,
  deleteReadMine,
  getPreferences,
  updatePreferences,
  adminSend,
};