const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const leadService = require("../services/lead.service");

const create = asyncHandler(async (req, res) => {
  const lead = await leadService.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "Message sent. We'll be in touch soon.", data: { id: lead.id } });
});

const getOne = asyncHandler(async (req, res) => {
  const lead = await leadService.getById(req.params.leadId);
  sendSuccess(res, { data: lead });
});

const update = asyncHandler(async (req, res) => {
  const lead = await leadService.update({
    leadId: req.params.leadId,
    status: req.body.status,
    notes: req.body.notes,
    assignedToUserId: req.body.assignedToUserId,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { message: "Lead updated.", data: lead });
});

const list = asyncHandler(async (req, res) => {
  const { status, assignedToUserId, page, limit } = req.query;
  const result = await leadService.list({ status, assignedToUserId, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { create, getOne, update, list };
