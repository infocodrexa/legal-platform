const { z } = require("zod");

const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3).max(200),
    description: z.string().min(1).max(5000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),
});

const ticketIdParamSchema = z.object({
  params: z.object({ ticketId: z.string().uuid() }),
});

const replySchema = z.object({
  params: z.object({ ticketId: z.string().uuid() }),
  body: z.object({ content: z.string().min(1).max(5000) }),
});

const updateStatusSchema = z.object({
  params: z.object({ ticketId: z.string().uuid() }),
  body: z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    resolutionNotes: z.string().max(5000).optional(),
  }),
});

const assignSchema = z.object({
  params: z.object({ ticketId: z.string().uuid() }),
  body: z.object({ assignedToUserId: z.string().uuid() }),
});

const listTicketsSchema = z.object({
  query: z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = {
  createTicketSchema,
  ticketIdParamSchema,
  replySchema,
  updateStatusSchema,
  assignSchema,
  listTicketsSchema,
};
