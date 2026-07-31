const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const appointmentService = require("../services/appointment.service");

const book = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment({
    userId: req.user.id,
    slotId: req.body.slotId,
  });
  sendSuccess(res, { statusCode: 201, message: "Appointment requested.", data: appointment });
});

const listMine = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await appointmentService.listUserAppointments({ userId: req.user.id, status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listAsLawyer = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await appointmentService.listLawyerAppointments({ userId: req.user.id, status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const getOne = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentDetail({
    appointmentId: req.params.appointmentId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
  });
  sendSuccess(res, { data: appointment });
});

const respond = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.respondToRequest({
    appointmentId: req.params.appointmentId,
    lawyerUserId: req.user.id,
    decision: req.body.decision,
    reason: req.body.reason,
  });
  sendSuccess(res, { message: `Appointment ${appointment.status.toLowerCase()}.`, data: appointment });
});

const cancel = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment({
    appointmentId: req.params.appointmentId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    reason: req.body.reason,
  });
  sendSuccess(res, { message: "Appointment cancelled.", data: appointment });
});

const complete = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.completeAppointment({
    appointmentId: req.params.appointmentId,
    lawyerUserId: req.user.id,
  });
  sendSuccess(res, { message: "Appointment marked completed.", data: appointment });
});

const reschedule = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.rescheduleAppointment({
    appointmentId: req.params.appointmentId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    newSlotId: req.body.newSlotId,
  });
  sendSuccess(res, { statusCode: 201, message: "Appointment rescheduled.", data: appointment });
});

module.exports = { book, listMine, listAsLawyer, getOne, respond, cancel, complete, reschedule };
