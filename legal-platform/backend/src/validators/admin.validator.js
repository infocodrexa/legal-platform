const { z } = require("zod");

const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(["GUEST", "USER", "LAWYER", "ADMIN", "SUPER_ADMIN"]).optional(),
    // Not z.coerce.boolean() — see service.validator.js for why that's
    // unsafe for a query-string filter (the string "false" coerces to
    // true, which would make ?isBanned=false silently return banned
    // users instead of unbanned ones).
    isBanned: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    search: z.string().max(200).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
});

const banUserSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({
    isBanned: z.boolean(),
    reason: z.string().max(1000).optional(),
  }),
});

const revenueQuerySchema = z.object({
  query: z.object({
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    groupBy: z.enum(["day", "month"]).default("day"),
  }),
});

const listLawyersSchema = z.object({
  query: z.object({
    kycStatus: z.enum(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const listPaymentsSchema = z.object({
  query: z.object({
    status: z.enum(["CREATED", "CAPTURED", "SETTLED", "FAILED", "REFUNDED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const listDocumentsSchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "REUPLOAD_REQUIRED"]).optional(),
    category: z.enum(["IDENTITY_PROOF", "ADDRESS_PROOF", "PROPERTY_DOCUMENT", "CONTRACT", "COURT_ORDER", "FINANCIAL_DOCUMENT", "OTHER"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const listAppointmentsSchema = z.object({
  query: z.object({
    status: z.enum(["REQUESTED", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED", "RESCHEDULED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const listAuditLogsSchema = z.object({
  query: z.object({
    entityType: z.string().max(100).optional(),
    action: z.string().max(100).optional(),
    actorUserId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

const listActivityEventsSchema = z.object({
  query: z
    .object({
      userId: z.string().uuid().optional(),

      entityType: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional(),

      entityId: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .optional(),

      action: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional(),

      search: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .optional(),

      from: z.string().date().optional(),
      to: z.string().date().optional(),

      page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),
    })
    .refine(
      (data) => {
        if (!data.from || !data.to) return true;
        return new Date(data.from) <= new Date(data.to);
      },
      {
        message: "from date must be before or equal to to date",
        path: ["from"],
      }
    ),
});

const activityEventIdParamSchema = z.object({
  params: z.object({
    activityEventId: z.string().uuid(),
  }),
});

module.exports = {
  listUsersSchema,
  userIdParamSchema,
  banUserSchema,
  revenueQuerySchema,
  listLawyersSchema,
  listPaymentsSchema,
  listDocumentsSchema,
  listAppointmentsSchema,
  listAuditLogsSchema,
  // Activity Timeline
  listActivityEventsSchema,
  activityEventIdParamSchema,
};
