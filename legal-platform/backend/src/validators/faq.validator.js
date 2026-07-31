const { z } = require("zod");

const createFaqSchema = z.object({
  body: z.object({
    question: z.string().min(3).max(500),
    answer: z.string().min(1).max(5000),
    category: z.string().max(100).optional(),
    displayOrder: z.coerce.number().int().optional(),
  }),
});

const updateFaqSchema = z.object({
  params: z.object({ faqId: z.string().uuid() }),
  body: z.object({
    question: z.string().min(3).max(500).optional(),
    answer: z.string().min(1).max(5000).optional(),
    category: z.string().max(100).optional(),
    displayOrder: z.coerce.number().int().optional(),
    isPublished: z.boolean().optional(),
  }),
});

const faqIdParamSchema = z.object({
  params: z.object({ faqId: z.string().uuid() }),
});

const listPublicFaqSchema = z.object({
  query: z.object({ category: z.string().optional() }),
});

const listAllFaqSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    // Not z.coerce.boolean() — see service.validator.js for why that's
    // unsafe for a query-string filter (the string "false" coerces to
    // true).
    isPublished: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
});

module.exports = { createFaqSchema, updateFaqSchema, faqIdParamSchema, listPublicFaqSchema, listAllFaqSchema };
