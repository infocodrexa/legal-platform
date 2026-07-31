const { z } = require("zod");

const createTestimonialSchema = z.object({
  body: z.object({
    authorName: z.string().min(1).max(200),
    authorRole: z.string().max(200).optional(),
    quote: z.string().min(1).max(2000),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    displayOrder: z.coerce.number().int().optional(),
  }),
});

const updateTestimonialSchema = z.object({
  params: z.object({ testimonialId: z.string().uuid() }),
  body: z.object({
    authorName: z.string().min(1).max(200).optional(),
    authorRole: z.string().max(200).optional(),
    quote: z.string().min(1).max(2000).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    displayOrder: z.coerce.number().int().optional(),
    // multer/FormData sends "true"/"false" as strings, not real
    // booleans — z.boolean() rejects strings outright. Same fix pattern
    // as the lawyer specializations multer bug.
    isPublished: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .optional()
      .transform((v) => (typeof v === "string" ? v === "true" : v)),
  }),
});

const testimonialIdParamSchema = z.object({
  params: z.object({ testimonialId: z.string().uuid() }),
});

const listAllTestimonialsSchema = z.object({
  query: z.object({
    // Not z.coerce.boolean() — see service.validator.js for why that's
    // unsafe for a query-string filter (the string "false" coerces to
    // true).
    isPublished: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

module.exports = {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialIdParamSchema,
  listAllTestimonialsSchema,
};
