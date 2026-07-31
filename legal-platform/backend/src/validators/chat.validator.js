const { z } = require("zod");

const appointmentIdParamSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid() }),
});

const listMessagesSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
});

module.exports = { appointmentIdParamSchema, listMessagesSchema };
