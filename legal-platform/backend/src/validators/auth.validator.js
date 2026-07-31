const { z } = require("zod");

// India-friendly phone: optional +91, 10 digits starting 6-9
const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().regex(phoneRegex, "Invalid Indian phone number"),
    password: passwordSchema,
  }),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3), // email or phone
    password: z.string().min(1),
  }),
});

const otpRequestSchema = z.object({
  body: z.object({
    identifier: z.string().min(3), // email or phone
    purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD", "PHONE_VERIFY"]),
  }),
});

const otpVerifySchema = z.object({
  body: z.object({
    identifier: z.string().min(3),
    otp: z.string().length(6),
    purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD", "PHONE_VERIFY"]),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(3),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(3),
    otp: z.string().length(6),
    newPassword: passwordSchema,
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(), // may also arrive via httpOnly cookie
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
};
