const { z } = require("zod");

const createOrderSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid(),
    buyerGstin: z
      .string()
      .regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 alphanumeric characters")
      .optional(),
  }),
});

const verifyCheckoutSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

const paymentIdParamSchema = z.object({
  params: z.object({ paymentId: z.string().uuid() }),
});

const listPaymentsSchema = z.object({
  query: z.object({
    status: z.enum(["CREATED", "CAPTURED", "SETTLED", "FAILED", "REFUNDED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = { createOrderSchema, verifyCheckoutSchema, paymentIdParamSchema, listPaymentsSchema };
