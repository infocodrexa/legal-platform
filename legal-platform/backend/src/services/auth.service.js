const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const env = require("../config/env");
const { ApiError } = require("../utils/apiResponse");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { generateOtp, hashOtp, compareOtp } = require("../utils/otp");
const { sendOtpEmail, sendPasswordResetConfirmation } = require("./email.service");
const { logActivity } = require("../utils/activityLogger");

const isEmail = (identifier) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

function findUserByIdentifier(identifier) {
  return prisma.user.findUnique({
    where: isEmail(identifier) ? { email: identifier } : { phone: identifier },
  });
}

// --------------------------------------------------------------------------
// Registration
// --------------------------------------------------------------------------
async function registerUser({ name, email, phone, password }) {
  const existingMatches = await prisma.user.findMany({
    where: { OR: [{ email }, { phone }] },
  });

  // A genuinely completed account (isVerified) owns this email/phone —
  // that's a real conflict.
  const verifiedConflict = existingMatches.find((u) => u.isVerified);
  if (verifiedConflict) {
    throw new ApiError(409, "An account with this email or phone already exists");
  }

  // Any matches left are unverified — abandoned registrations that never
  // finished OTP verification (wrong code, expired, never delivered,
  // person just closed the tab). These were previously blocking the same
  // email/phone from ever registering again, permanently, which is the
  // actual bug: register → fail at the OTP step → that email/phone is
  // dead forever. Safe to reclaim: delete the stale row(s) and let this
  // attempt create a fresh one. OtpVerification rows for the deleted
  // user cascade-delete automatically (see the schema's onDelete: Cascade
  // on that relation) — nothing orphaned behind.
  if (existingMatches.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: existingMatches.map((u) => u.id) } },
    });
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "USER", isVerified: false },
  });

  await issueOtp({ userId: user.id, identifier: email, purpose: "REGISTER" });

  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
}

// --------------------------------------------------------------------------
// OTP issuance + verification (shared by REGISTER / LOGIN / RESET_PASSWORD / PHONE_VERIFY)
// --------------------------------------------------------------------------
async function issueOtp({ userId = null, identifier, purpose }) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: { userId, identifier, otpHash, purpose, expiresAt },
  });

  // Only email delivery is wired in Phase 1. WhatsApp/SMS delivery is added
  // in Phase 4 (Notification module) per the build-order spec.
  if (isEmail(identifier)) {
    await sendOtpEmail(identifier, otp, purpose);
  } else {
    console.log(`[otp:dev-mode] identifier=${identifier} purpose=${purpose} otp=${otp}`);
  }

  return { expiresAt };
}

async function requestOtp({ identifier, purpose }) {
  const user = await findUserByIdentifier(identifier);

  if (purpose === "REGISTER") {
    if (!user) throw new ApiError(404, "No pending registration found for this identifier");
    if (user.isVerified) throw new ApiError(409, "Account is already verified");
  } else {
    // LOGIN / RESET_PASSWORD / PHONE_VERIFY all require an existing user.
    // Respond generically either way to avoid user-enumeration for reset flows.
    if (!user && purpose === "RESET_PASSWORD") {
      return { expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000) };
    }
    if (!user) throw new ApiError(404, "No account found for this identifier");
    if (user.isBanned) throw new ApiError(403, "Account is banned");
  }

  return issueOtp({ userId: user ? user.id : null, identifier, purpose });
}

async function verifyOtp({ identifier, otp, purpose }) {
  const record = await prisma.otpVerification.findFirst({
    where: { identifier, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new ApiError(400, "No active OTP for this identifier. Request a new one.");
  if (record.expiresAt < new Date()) throw new ApiError(400, "OTP has expired. Request a new one.");
  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many incorrect attempts. Request a new OTP.");
  }

  const isValid = await compareOtp(otp, record.otpHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(400, "Incorrect OTP");
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  return record;
}

// --------------------------------------------------------------------------
// Token issuance / refresh rotation
// --------------------------------------------------------------------------
async function issueTokenPair(user, { userAgent, ipAddress } = {}) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  const decoded = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  return { accessToken, refreshToken };
}

async function completeRegistration({ identifier, otp }) {
  await verifyOtp({ identifier, otp, purpose: "REGISTER" });

  const user = await prisma.user.update({
    where: { email: identifier },
    data: { isVerified: true },
  });

  const tokens = await issueTokenPair(user);

await logActivity({
  userId: user.id,
  entityType: "User",
  entityId: user.id,
  action: "USER_REGISTER",
  title: "New User Registered",
  description: `${user.name} completed registration.`,
});

return tokens;
}

async function loginWithPassword({ identifier, password }, meta) {
  const user = await findUserByIdentifier(identifier);

  // Constant-shape error to avoid leaking which part (identifier/password) was wrong.
  if (!user) throw new ApiError(401, "Invalid credentials");
  if (user.isBanned) throw new ApiError(403, "Account is banned");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  if (!user.isVerified) {
    throw new ApiError(403, "Account is not verified. Please verify your email first.");
  }

  const tokens = await issueTokenPair(user, meta);

await logActivity({
  userId: user.id,
  entityType: "User",
  entityId: user.id,
  action: "USER_LOGIN",
  title: "User Logged In",
  description: `${user.name} logged in using password.`,
});

return tokens;
}

async function loginWithOtp({ identifier, otp }, meta) {
  await verifyOtp({ identifier, otp, purpose: "LOGIN" });
  const user = await findUserByIdentifier(identifier);
  if (!user) throw new ApiError(404, "No account found for this identifier");
  if (user.isBanned) throw new ApiError(403, "Account is banned");
  const tokens = await issueTokenPair(user, meta);

await logActivity({
  userId: user.id,
  entityType: "User",
  entityId: user.id,
  action: "USER_LOGIN",
  title: "User Logged In",
  description: `${user.name} logged in using OTP.`,
});

return tokens;
}

async function refreshTokens(rawRefreshToken, meta) {
  if (!rawRefreshToken) throw new ApiError(401, "Refresh token missing");

  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: rawRefreshToken } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    // Reuse of a revoked/expired token is a strong signal of theft —
    // proactively revoke all of the user's sessions.
    if (stored && stored.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revoked: false },
        data: { revoked: true },
      });
    }
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.isBanned || user.deletedAt) {
    throw new ApiError(401, "Account no longer accessible");
  }

  // Rotation: revoke the used token, issue a brand new pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  return issueTokenPair(user, meta);
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  await prisma.refreshToken
    .updateMany({ where: { token: rawRefreshToken, revoked: false }, data: { revoked: true } })
    .catch(() => {}); // token may already be gone/invalid — logout should be idempotent
}

// --------------------------------------------------------------------------
// Forgot / reset password
// --------------------------------------------------------------------------
async function forgotPassword({ identifier }) {
  return requestOtp({ identifier, purpose: "RESET_PASSWORD" });
}

async function resetPassword({ identifier, otp, newPassword }) {
  await verifyOtp({ identifier, otp, purpose: "RESET_PASSWORD" });

  const user = await findUserByIdentifier(identifier);
  if (!user) throw new ApiError(404, "No account found for this identifier");

  const passwordHash = await bcrypt.hash(
    newPassword,
    env.BCRYPT_SALT_ROUNDS
  );

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),

    // Invalidate every existing session on password reset.
    prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    }),
  ]);

  await logActivity({
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "PASSWORD_RESET",
    title: "Password Reset",
    description: `${user.name} changed account password.`,
  });

  if (isEmail(identifier)) {
    await sendPasswordResetConfirmation(identifier);
  }
}

module.exports = {
  findUserByIdentifier,
  registerUser,
  requestOtp,
  verifyOtp,
  completeRegistration,
  loginWithPassword,
  loginWithOtp,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
  issueTokenPair,
};
