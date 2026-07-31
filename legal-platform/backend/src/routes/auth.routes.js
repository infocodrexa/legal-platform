const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { authLimiter } = require("../middlewares/rateLimiter");
const { verifyCsrfToken } = require("../middlewares/csrf.middleware");
const {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  controller.register,
);

router.post(
  "/otp/request",
  authLimiter,
  validate(otpRequestSchema),
  controller.requestOtp,
);

router.post(
  "/otp/verify-registration",
  authLimiter,
  validate(otpVerifySchema),
  controller.verifyRegistrationOtp,
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  controller.loginWithPassword,
);

router.post(
  "/login/otp",
  authLimiter,
  validate(otpVerifySchema),
  controller.loginWithOtp,
);

// CSRF-checked: these two rely on the ambient refresh-token cookie when a
// browser client is calling them (see csrf.middleware.js for why non-cookie
// clients are exempt).
router.post("/refresh-token", validate(refreshTokenSchema), controller.refresh);

router.post("/logout", verifyCsrfToken, controller.logout);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword,
);

router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  controller.resetPassword,
);

module.exports = router;
