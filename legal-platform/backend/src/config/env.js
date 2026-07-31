const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default("rlp_refresh_token"),

  OTP_LENGTH: z.coerce.number().default(6),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(600000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("legal-documents"),
  SUPABASE_PROFILE_BUCKET: z.string().default("profiles"),

  AWS_REGION: z.string().default("ap-south-1"),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_SIGNED_URL_EXPIRY_SECONDS: z.coerce.number().default(300),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PLATFORM_COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(15),

  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().default("urn:ietf:wg:oauth:2.0:oob"),
  GOOGLE_CALENDAR_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),

  REMINDER_CRON_SCHEDULE: z.string().default("*/5 * * * *"),
  REMINDER_LEAD_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),

  WHATSAPP_BUSINESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default("v20.0"),
  WHATSAPP_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  SOCKET_CORS_ORIGIN: z.string().default("http://localhost:3000"),

  SITE_URL: z.string().url().default("https://example.com"),

  // 64 hex chars = 32 bytes, for AES-256-GCM field-level encryption.
  FIELD_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "FIELD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)")
    .optional(),

  REDIS_URL: z.string().optional(),
  CACHE_TTL_SECONDS: z.coerce.number().default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loudly — never boot the server with a broken/missing config.
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
