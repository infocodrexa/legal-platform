const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const lawyerService = require("../services/lawyer.service");

const upsertProfile = asyncHandler(async (req, res) => {
  const licenseFile = req.files?.licenseDoc?.[0];
  const panFile = req.files?.panDoc?.[0];

  const profile = await lawyerService.upsertProfile({
    userId: req.user.id,
    ...req.body,
    licenseFile,
    panFile,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Lawyer profile saved. KYC status: " + profile.kycStatus,
    data: profile,
  });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await lawyerService.getProfileByUserId(req.user.id);
  const withDocs = await lawyerService.getProfileWithSignedDocs(profile);
  sendSuccess(res, { data: withDocs });
});

// Admin needs to actually see the license/PAN documents to make a KYC
// decision — the public/self-serve profile endpoints above don't cover
// "any lawyer, with docs, as an admin". Completes the existing KYC
// decision page, which had nothing to fetch this from until now.
const getProfileForAdmin = asyncHandler(async (req, res) => {
  const profile = await lawyerService.getProfileById(req.params.lawyerProfileId);
  const withDocs = await lawyerService.getProfileWithSignedDocs(profile);
  sendSuccess(res, { data: withDocs });
});

const decideKyc = asyncHandler(async (req, res) => {
  const profile = await lawyerService.decideKyc({
    lawyerProfileId: req.params.lawyerProfileId,
    decision: req.body.decision,
    remarks: req.body.remarks,
  });
  sendSuccess(res, { message: `KYC ${profile.kycStatus.toLowerCase()}.`, data: profile });
});

const setRazorpayAccount = asyncHandler(async (req, res) => {
  const profile = await lawyerService.setRazorpayAccountId({
    lawyerProfileId: req.params.lawyerProfileId,
    razorpayAccountId: req.body.razorpayAccountId,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { message: "Payout account linked.", data: profile });
});

const setWorkingHours = asyncHandler(async (req, res) => {
  const profile = await lawyerService.getProfileByUserId(req.user.id);
  const hours = await lawyerService.setWorkingHours({
    lawyerProfileId: profile.id,
    workingHours: req.body.workingHours,
  });
  sendSuccess(res, { message: "Working hours updated.", data: hours });
});

const generateSlots = asyncHandler(async (req, res) => {
  const profile = await lawyerService.getProfileByUserId(req.user.id);
  const result = await lawyerService.generateSlots({ lawyerProfileId: profile.id, ...req.body });
  sendSuccess(res, { message: `${result.created} new slot(s) created.`, data: result });
});

const listAvailableSlots = asyncHandler(async (req, res) => {
  const slots = await lawyerService.listAvailableSlots({
    lawyerProfileId: req.params.lawyerProfileId,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
  });
  sendSuccess(res, { data: slots });
});


const availabilityCalendar = asyncHandler(async (req, res) => {
  const result = await lawyerService.getAvailabilityCalendar({
    lawyerProfileId: req.params.lawyerProfileId,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
  });

  sendSuccess(res, {
    data: result,
  });
});

const listPublicDirectory = asyncHandler(async (req, res) => {
  const { specialization, page, limit } = req.query;
  const result = await lawyerService.listPublicDirectory({ specialization, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await lawyerService.getPublicProfile(req.params.lawyerProfileId);
  sendSuccess(res, { data: profile });
});

module.exports = {
  upsertProfile,
  getMyProfile,
  getProfileForAdmin,
  decideKyc,
  setRazorpayAccount,
  setWorkingHours,
  generateSlots,
  listAvailableSlots,
  availabilityCalendar,
  listPublicDirectory,
  getPublicProfile,
};
