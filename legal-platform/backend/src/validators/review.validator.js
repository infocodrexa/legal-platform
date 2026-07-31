const { z } = require("zod");

const createReviewSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  }),
});

const reviewIdParamSchema = z.object({
  params: z.object({ reviewId: z.string().uuid() }),
});

const listByLawyerSchema = z.object({
  params: z.object({ lawyerProfileId: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const moderateReviewSchema = z.object({
  params: z.object({ reviewId: z.string().uuid() }),
  body: z.object({ isPublished: z.boolean() }),
});

const listAllReviewsSchema = z.object({
  query: z.object({
    // Not z.coerce.boolean() — see service.validator.js for why that's
    // unsafe for a query-string filter (the string "false" coerces to
    // true).
    isPublished: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = {
  createReviewSchema,
  reviewIdParamSchema,
  listByLawyerSchema,
  moderateReviewSchema,
  listAllReviewsSchema,
};
