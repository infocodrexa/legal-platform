const { z } = require("zod");
const listNotificationsSchema = z.object({ query: z.object({
  status: z.enum(["PENDING", "SENT", "FAILED", "SKIPPED"]).optional(),
  isRead: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) });
const notificationIdSchema = z.object({ params: z.object({ notificationId: z.string().uuid() }) });
const preferenceSchema = z.object({ body: z.object({
  inAppEnabled: z.boolean().optional(), emailEnabled: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(), paymentUpdates: z.boolean().optional(),
  chatNotifications: z.boolean().optional(), promotional: z.boolean().optional(),
}).strict() });
const adminSendSchema = z.object({ body: z.object({
  audience: z.enum(["USERS", "LAWYERS", "EVERYONE", "SELECTED"]),
  recipientIds: z.array(z.string().uuid()).max(500).default([]),
  title: z.string().trim().min(2).max(150), message: z.string().trim().min(2).max(4000),
  link: z.string().max(500).optional(),
  channels: z.array(z.enum(["BROWSER", "EMAIL"])).min(1).default(["BROWSER"]),
}).superRefine((value, ctx) => {
  if (value.audience === "SELECTED" && value.recipientIds.length === 0) ctx.addIssue({ code: "custom", path: ["recipientIds"], message: "Select at least one recipient" });
}) });
module.exports = { listNotificationsSchema, notificationIdSchema, preferenceSchema, adminSendSchema };
