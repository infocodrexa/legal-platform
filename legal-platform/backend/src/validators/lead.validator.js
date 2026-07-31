const { z } = require("zod");

const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    email: z.string().email(),
    phone: z.string().regex(phoneRegex, "Invalid Indian phone number").optional(),
    topic: z.string().max(200).optional(),
    message: z.string().min(10).max(5000),
  }),
});

const updateLeadSchema = z.object({
  params: z.object({ leadId: z.string().uuid() }),
  body: z.object({
    status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]).optional(),
    notes: z.string().max(5000).optional(),
    assignedToUserId: z.string().uuid().nullable().optional(),
  }),
});

const leadIdParamSchema = z.object({
  params: z.object({ leadId: z.string().uuid() }),
});

const listLeadsSchema = z.object({
  query: z.object({
    status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]).optional(),
    assignedToUserId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = { createLeadSchema, updateLeadSchema, leadIdParamSchema, listLeadsSchema };
