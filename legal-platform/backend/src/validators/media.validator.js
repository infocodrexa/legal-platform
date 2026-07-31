const { z } = require("zod");

const listMediaSchema = z.object({
  query: z.object({
    usageContext: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

const mediaIdParamSchema = z.object({
  params: z.object({ mediaAssetId: z.string().uuid() }),
});

module.exports = { listMediaSchema, mediaIdParamSchema };
