const { z } = require("zod");

const requestRefundSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid(),
    amount: z.coerce.number().positive().optional(), // omit for a full refund
    reason: z.string().max(1000).optional(),
  }),
});

const refundIdParamSchema = z.object({
  params: z.object({ refundId: z.string().uuid() }),
});

const rejectRefundSchema = z.object({
  params: z.object({ refundId: z.string().uuid() }),
  body: z.object({ rejectionReason: z.string().min(1).max(1000) }),
});

const listRefundsSchema = z.object({
  query: z.object({
    status: z.enum(["REQUESTED", "APPROVED", "REJECTED", "PROCESSING", "PROCESSED", "FAILED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = { requestRefundSchema, refundIdParamSchema, rejectRefundSchema, listRefundsSchema };
