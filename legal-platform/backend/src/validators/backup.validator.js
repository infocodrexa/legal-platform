const { z } = require("zod");

const listBackupsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const backupIdParamSchema = z.object({
  params: z.object({ backupId: z.string().uuid() }),
});

const requestRestoreSchema = z.object({
  params: z.object({ backupId: z.string().uuid() }),
  body: z.object({ reason: z.string().max(1000).optional() }),
});

module.exports = { listBackupsSchema, backupIdParamSchema, requestRestoreSchema };
