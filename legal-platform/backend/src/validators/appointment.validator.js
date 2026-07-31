const { z } = require("zod");

const bookAppointmentSchema = z.object({
  body: z.object({ slotId: z.string().uuid() }),
});

const appointmentIdParamSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid() }),
});

const respondSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({
    decision: z.enum(["ACCEPTED", "REJECTED"]),
    reason: z.string().max(500).optional(),
  }),
});

const cancelSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({ reason: z.string().max(500).optional() }),
});

const rescheduleSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid() }),
  body: z.object({ newSlotId: z.string().uuid() }),
});

const listAppointmentsSchema = z.object({
  query: z.object({
    status: z
      .enum(["REQUESTED", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED", "RESCHEDULED"])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = {
  bookAppointmentSchema,
  appointmentIdParamSchema,
  respondSchema,
  cancelSchema,
  rescheduleSchema,
  listAppointmentsSchema,
};
