const { z } = require("zod");

const upsertSeoMetaSchema = z.object({
  body: z.object({
    path: z.string().min(1).max(300).regex(/^\//, "path must start with /"),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    canonicalUrl: z.string().url().optional(),
    schemaJson: z
      .union([z.string(), z.record(z.any())])
      .optional()
      .transform((v, ctx) => {
        if (v === undefined) return undefined;
        if (typeof v === "string") {
          try {
            return JSON.parse(v);
          } catch {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "schemaJson must be valid JSON" });
            return z.NEVER;
          }
        }
        return v;
      }),
  }),
});

const pathQuerySchema = z.object({
  query: z.object({ path: z.string().min(1) }),
});

const seoIdParamSchema = z.object({
  params: z.object({ seoMetaId: z.string().uuid() }),
});

const listSeoMetaSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
});

module.exports = { upsertSeoMetaSchema, pathQuerySchema, seoIdParamSchema, listSeoMetaSchema };
