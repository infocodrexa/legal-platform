const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const adminService = require("../services/admin.service");
const lawyerService = require("../services/lawyer.service");

const overview = asyncHandler(async (req, res) => {
  const data = await adminService.getOverview();
  sendSuccess(res, { data });
});

const revenue = asyncHandler(async (req, res) => {
  const { from, to, groupBy } = req.query;
  const data = await adminService.getRevenueOverTime({ from, to, groupBy });
  sendSuccess(res, { data });
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, isBanned, search, page, limit } = req.query;
  const result = await adminService.listUsers({ role, isBanned, search, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const getUser = asyncHandler(async (req, res) => {
  const data = await adminService.getUserDetail(req.params.userId);
  sendSuccess(res, { data });
});

const banUser = asyncHandler(async (req, res) => {
  const user = await adminService.setBanStatus({
    userId: req.params.userId,
    isBanned: req.body.isBanned,
    reason: req.body.reason,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { message: user.isBanned ? "User banned." : "User unbanned.", data: user });
});

const forceLogout = asyncHandler(async (req, res) => {
  const result = await adminService.forceLogout({ userId: req.params.userId, adminUserId: req.user.id });
  sendSuccess(res, { message: `${result.sessionsRevoked} session(s) revoked.`, data: result });
});

const listLawyers = asyncHandler(async (req, res) => {
  const { kycStatus, page, limit } = req.query;
  const result = await adminService.listLawyers({ kycStatus, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

// Full detail (signed license/PAN URLs, kycRemarks, contact info) for the
// KYC review workflow — the list above only has the summary fields shown
// in a table row.
const getLawyer = asyncHandler(async (req, res) => {
  const profile = await lawyerService.getProfileById(req.params.lawyerProfileId);
  const withDocs = await lawyerService.getProfileWithSignedDocs(profile);
  sendSuccess(res, { data: withDocs });
});

const listPayments = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await adminService.listAllPayments({ status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listDocuments = asyncHandler(async (req, res) => {
  const { status, category, page, limit } = req.query;
  const result = await adminService.listAllDocuments({ status, category, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listAppointments = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await adminService.listAllAppointments({ status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, action, actorUserId, page, limit } = req.query;
  const result = await adminService.listAuditLogs({ entityType, action, actorUserId, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listActivityEvents = asyncHandler(async (req, res) => {
  const {
    userId,
    entityType,
    entityId,
    action,
    search,
    from,
    to,
    page,
    limit,
  } = req.query;

  const result = await adminService.listActivityEvents({
    userId,
    entityType,
    entityId,
    action,
    search,
    from,
    to,
    page,
    limit,
  });

  sendSuccess(res, {
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

const getActivityEvent = asyncHandler(async (req, res) => {
  const data = await adminService.getActivityEventDetail(
    req.params.activityEventId
  );

  sendSuccess(res, { data });
});

module.exports = {
  overview, revenue, listUsers, getUser, banUser, forceLogout, listLawyers, getLawyer,
  listPayments, listDocuments, listAppointments, listAuditLogs,
   // Activity Timeline
  listActivityEvents,
  getActivityEvent,
};
