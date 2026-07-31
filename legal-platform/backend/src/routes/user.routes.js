const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const validate = require("../middlewares/validate");
const prisma = require("../config/db");
const { z } = require("zod");

const router = express.Router();

const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^(?:\+91)?[6-9]\d{9}$/, "Invalid Indian phone number")
      .optional(),
  }),
});

const SAFE_USER_SELECT = { id: true, name: true, email: true, phone: true, role: true, isVerified: true, createdAt: true };

// Any authenticated, non-banned role can view their own profile.
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: SAFE_USER_SELECT });
    sendSuccess(res, { data: user });
  })
);

// Completes the Settings page's existing profile-edit form — email/phone
// changes go through the same uniqueness check as registration.
router.patch(
  "/me",
  authenticate,
  validate(updateMeSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    if (email || phone) {
      const conflict = await prisma.user.findFirst({
        where: {
          id: { not: req.user.id },
          OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
        },
      });
      if (conflict) throw new ApiError(409, "That email or phone is already in use by another account");
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(email && { email }), ...(phone && { phone }) },
      select: SAFE_USER_SELECT,
    });
    sendSuccess(res, { message: "Profile updated.", data: updated });
  })
);


// Active device/session management. Refresh-token values are never returned.
router.get(
  "/me/sessions",
  authenticate,
  asyncHandler(async (req, res) => {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user.id, revoked: false, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, { data: sessions });
  })
);

router.delete(
  "/me/sessions/:sessionId",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await prisma.refreshToken.updateMany({
      where: { id: req.params.sessionId, userId: req.user.id, revoked: false },
      data: { revoked: true },
    });
    if (!result.count) throw new ApiError(404, "Session not found");
    sendSuccess(res, { message: "The selected device has been signed out." });
  })
);

router.delete(
  "/me/sessions",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await prisma.refreshToken.updateMany({
      where: { userId: req.user.id, revoked: false },
      data: { revoked: true },
    });
    sendSuccess(res, { message: "All devices have been signed out.", data: { sessionsRevoked: result.count } });
  })
);

// Example RBAC-gated route — only ADMIN/SUPER_ADMIN may list users.
// (Full pagination/filtering lands with the Phase 5 Admin dashboard APIs.)
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true, phone: true, role: true, isBanned: true, createdAt: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, { data: users });
  })
);

module.exports = router;
