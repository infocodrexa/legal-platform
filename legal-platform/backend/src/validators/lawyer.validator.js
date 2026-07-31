const { z } = require("zod");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm, 24h

const upsertProfileSchema = z.object({
  body: z.object({
    barCouncilId: z.string().min(3).max(50),
    bio: z.string().max(2000).optional(),
    // multer collapses a single repeated-field-name value (e.g. one
    // <input> submitted once) to a plain string instead of a 1-item
    // array — normalize before validating as an array, same fix applied
    // elsewhere in this codebase for the same multer behavior.
    specializations: z
      .union([z.array(z.string().min(1)), z.string().min(1)])
      .optional()
      .transform((v) => (typeof v === "string" ? [v] : v))
      .pipe(z.array(z.string().min(1)).max(20).optional()),
    experienceYears: z.coerce.number().int().min(0).max(70).optional(),
    consultationCharge: z.coerce.number().positive().max(1000000),
  }),
});

const kycDecisionSchema = z.object({
  body: z.object({
    decision: z.enum(["VERIFIED", "REJECTED"]),
    remarks: z.string().max(1000).optional(),
  }),
  params: z.object({ lawyerProfileId: z.string().uuid() }),
});

const dayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const setWorkingHoursSchema = z.object({
  body: z.object({
    workingHours: z
      .array(
        z
          .object({
            dayOfWeek: dayOfWeekEnum,
            startTime: z.string().regex(timeRegex, "startTime must be HH:mm"),
            endTime: z.string().regex(timeRegex, "endTime must be HH:mm"),
            isActive: z.boolean().optional(),
          })
          .refine((v) => v.startTime < v.endTime, {
            message: "startTime must be before endTime",
            path: ["endTime"],
          })
      )
      .min(1)
      .max(7),
  }),
});

const generateSlotsSchema = z.object({
  body: z.object({
    fromDate: z.string().date(),
    toDate: z.string().date(),
    slotDurationMinutes: z.coerce.number().int().min(10).max(240).default(30),
  }),
});

const listSlotsSchema = z.object({
  query: z.object({
    fromDate: z.string().date().optional(),
    toDate: z.string().date().optional(),
  }),
  params: z.object({ lawyerProfileId: z.string().uuid() }),
});

const availabilityCalendarSchema = z.object({
  query: z.object({
    fromDate: z.string().date(),
    toDate: z.string().date(),
  }),
  params: z.object({
    lawyerProfileId: z.string().uuid(),
  }),
});

const setRazorpayAccountSchema = z.object({
  params: z.object({ lawyerProfileId: z.string().uuid() }),
  body: z.object({ razorpayAccountId: z.string().min(3).max(100) }),
});

const listPublicDirectorySchema = z.object({
  query: z.object({
    specialization: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

const lawyerProfileIdParamSchema = z.object({
  params: z.object({ lawyerProfileId: z.string().uuid() }),
});

module.exports = {
  upsertProfileSchema,
  kycDecisionSchema,
  setWorkingHoursSchema,
  generateSlotsSchema,
  listSlotsSchema,
  availabilityCalendarSchema,
  setRazorpayAccountSchema,
  listPublicDirectorySchema,
  lawyerProfileIdParamSchema,
};
