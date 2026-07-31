const { z } = require("zod");

const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    description: z.string().min(1).max(500),
    longDescription: z.string().max(3000).optional(),
    icon: z.string().max(50).optional(),
    feeRangeMin: z.coerce.number().positive().optional(),
    feeRangeMax: z.coerce.number().positive().optional(),
    covers: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v)),
    displayOrder: z.coerce.number().int().optional(),
  }),
});

const updateServiceSchema = z.object({
  params: z.object({ serviceId: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().min(1).max(500).optional(),
    longDescription: z.string().max(3000).optional(),
    icon: z.string().max(50).optional(),
    feeRangeMin: z.coerce.number().positive().optional(),
    feeRangeMax: z.coerce.number().positive().optional(),
    covers: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((v) => (v === undefined ? undefined : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v)),
    displayOrder: z.coerce.number().int().optional(),
    // multer/FormData sends "true"/"false" as strings — z.boolean() would
    // reject them outright; z.coerce.boolean() (used elsewhere) has its
    // own bug where ANY non-empty string, including "false", becomes
    // true. This is the correct fix for both.
    isPublished: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .optional()
      .transform((v) => (typeof v === "string" ? v === "true" : v)),
  }),
});

const serviceIdParamSchema = z.object({
  params: z.object({ serviceId: z.string().uuid() }),
});

const slugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

const listPublishedServicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

const listAllServicesSchema = z.object({
  query: z.object({
    // NOT z.coerce.boolean() — that turns the literal string "false" into
    // `true` (any non-empty string is truthy in JS), which would make
    // ?isPublished=false silently filter for published services instead.
    isPublished: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  slugParamSchema,
  listPublishedServicesSchema,
  listAllServicesSchema,
};
