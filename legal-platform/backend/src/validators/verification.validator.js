const { z } = require("zod");

// const listQueueSchema = z.object({
//   query: z.object({
//     status: z.enum(["PENDING", "UNDER_REVIEW"]).optional(),
//     page: z.coerce.number().int().min(1).default(1),
//     limit: z.coerce.number().int().min(1).max(100).default(20),
//   }),
// });

const listQueueSchema = z.object({
  query: z.object({
    status: z.enum([
      "PENDING",
      "UNDER_REVIEW",
      "VERIFIED",
      "REJECTED",
      "REUPLOAD_REQUIRED",
    ]).optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const documentIdParamSchema = z.object({
  params: z.object({ documentId: z.string().uuid() }),
});

const decisionSchema = z.object({
  params: z.object({ documentId: z.string().uuid() }),
  body: z.object({
    status: z.enum(["VERIFIED", "REJECTED", "REUPLOAD_REQUIRED"]),
    remarks: z.string().max(1000).optional(),
  }),
});

module.exports = { listQueueSchema, documentIdParamSchema, decisionSchema };
