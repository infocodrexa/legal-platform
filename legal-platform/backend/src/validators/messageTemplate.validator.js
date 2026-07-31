const { z } = require("zod");

const NOTIFICATION_TYPES = [
  "APPOINTMENT_REQUESTED",
  "APPOINTMENT_ACCEPTED",
  "APPOINTMENT_REJECTED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_REMINDER",
  "DOCUMENT_STATUS_CHANGED",
  "KYC_STATUS_CHANGED",
  "PAYMENT_CAPTURED",
  "PAYMENT_FAILED",
  "REFUND_REQUESTED",
  "REFUND_PROCESSED",
  "CHAT_MESSAGE_RECEIVED",
];

const upsertTemplateSchema = z.object({
  body: z
    .object({
      type: z.enum(NOTIFICATION_TYPES),
      channel: z.enum(["EMAIL", "WHATSAPP"]),
      subject: z.string().max(200).optional(),
      bodyText: z.string().min(1).max(5000),
      whatsappTemplateName: z.string().max(200).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => v.channel !== "EMAIL" || !!v.subject, {
      message: "subject is required for EMAIL templates",
      path: ["subject"],
    })
    .refine((v) => v.channel !== "WHATSAPP" || !!v.whatsappTemplateName, {
      message: "whatsappTemplateName is required for WHATSAPP templates (must match an approved Meta template)",
      path: ["whatsappTemplateName"],
    }),
});

const templateIdParamSchema = z.object({
  params: z.object({ templateId: z.string().uuid() }),
});

const listTemplatesSchema = z.object({
  query: z.object({
    type: z.enum(NOTIFICATION_TYPES).optional(),
    channel: z.enum(["EMAIL", "WHATSAPP"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

const previewTemplateSchema = z.object({
  body: z.object({
    type: z.enum(NOTIFICATION_TYPES),
    channel: z.enum(["EMAIL", "WHATSAPP"]),
    sampleData: z.record(z.any()).optional(),
  }),
});

module.exports = { upsertTemplateSchema, templateIdParamSchema, listTemplatesSchema, previewTemplateSchema };
