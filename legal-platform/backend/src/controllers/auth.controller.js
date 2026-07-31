const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const env = require("../config/env");
const authService = require("../services/auth.service");
const { issueCsrfToken } = require("../middlewares/csrf.middleware");

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30d — keep in sync with JWT_REFRESH_EXPIRES_IN
};

function setRefreshCookie(res, token) {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, token, cookieOptions);
  // Every time the refresh cookie is (re)issued, refresh the paired CSRF
  // token too — see csrf.middleware.js for why this pairing exists.
  return issueCsrfToken(res);
}

function clearRefreshCookie(res) {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  res.clearCookie("rlp_csrf_token", { ...cookieOptions, httpOnly: false, maxAge: 0 });
}

function meta(req) {
  return { userAgent: req.headers["user-agent"], ipAddress: req.ip };
}

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: "Registration successful. Check your email for an OTP to verify your account.",
    data: user,
  });
});

const requestOtp = asyncHandler(async (req, res) => {
  const { expiresAt } = await authService.requestOtp(req.body);
  sendSuccess(res, { message: "OTP sent.", data: { expiresAt } });
});

// Completes registration (purpose=REGISTER) — verifies OTP and logs the user in.
const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;
  const { accessToken, refreshToken } = await authService.completeRegistration({ identifier, otp });
  const csrfToken = setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: "Account verified.", data: { accessToken, csrfToken } });
});

const loginWithPassword = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const { accessToken, refreshToken } = await authService.loginWithPassword(
    { identifier, password },
    meta(req)
  );
  const csrfToken = setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: "Login successful.", data: { accessToken, csrfToken } });
});

const loginWithOtp = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;
  const { accessToken, refreshToken } = await authService.loginWithOtp({ identifier, otp }, meta(req));
  const csrfToken = setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: "Login successful.", data: { accessToken, csrfToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] || req.body.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshTokens(incoming, meta(req));
  const csrfToken = setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: "Token refreshed.", data: { accessToken, csrfToken } });
});

const logout = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME] || req.body.refreshToken;
  await authService.logout(incoming);
  clearRefreshCookie(res);
  sendSuccess(res, { message: "Logged out." });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  // Always return the same message regardless of whether the account exists,
  // to avoid leaking which identifiers are registered.
  sendSuccess(res, { message: "If an account exists for this identifier, an OTP has been sent." });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, { message: "Password has been reset. Please log in again." });
});

module.exports = {
  register,
  requestOtp,
  verifyRegistrationOtp,
  loginWithPassword,
  loginWithOtp,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
