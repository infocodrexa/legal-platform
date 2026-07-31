const { z } = require("zod");

const categoryEnum = z.enum([
  "IDENTITY_PROOF",
  "ADDRESS_PROOF",
  "PROPERTY_DOCUMENT",
  "CONTRACT",
  "COURT_ORDER",
  "FINANCIAL_DOCUMENT",
  "OTHER",
]);

const uploadDocumentSchema = z.object({
  body: z.object({
    category: categoryEnum,
  }),
});

const listDocumentsSchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "REUPLOAD_REQUIRED"]).optional(),
    category: categoryEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const documentIdParamSchema = z.object({
  params: z.object({ documentId: z.string().uuid() }),
});

module.exports = { uploadDocumentSchema, listDocumentsSchema, documentIdParamSchema };
