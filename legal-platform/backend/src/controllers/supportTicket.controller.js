const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const ticketService = require("../services/supportTicket.service");

const create = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket({
    userId: req.user.id,
    subject: req.body.subject,
    description: req.body.description,
    priority: req.body.priority,
  });
  sendSuccess(res, { statusCode: 201, message: "Support ticket created.", data: ticket });
});

const getOne = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketForActor({
    ticketId: req.params.ticketId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
  });
  sendSuccess(res, { data: ticket });
});

const reply = asyncHandler(async (req, res) => {
  const reply = await ticketService.addReply({
    ticketId: req.params.ticketId,
    authorId: req.user.id,
    actorRole: req.user.role,
    content: req.body.content,
  });
  sendSuccess(res, { statusCode: 201, message: "Reply added.", data: reply });
});

const updateStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateStatus({
    ticketId: req.params.ticketId,
    adminUserId: req.user.id,
    status: req.body.status,
    resolutionNotes: req.body.resolutionNotes,
  });
  sendSuccess(res, { message: `Ticket marked ${ticket.status}.`, data: ticket });
});

const assign = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTicket({
    ticketId: req.params.ticketId,
    adminUserId: req.user.id,
    assignedToUserId: req.body.assignedToUserId,
  });
  sendSuccess(res, { message: "Ticket assigned.", data: ticket });
});

const listMine = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await ticketService.listMyTickets({ userId: req.user.id, status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listAll = asyncHandler(async (req, res) => {
  const { status, priority, page, limit } = req.query;
  const result = await ticketService.listAllTickets({ status, priority, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

module.exports = { create, getOne, reply, updateStatus, assign, listMine, listAll };
