const crypto = require("crypto");
const env = require("../config/env");
const { ApiError } = require("../utils/apiResponse");

// SameSite=strict on the refresh-token cookie is the primary CSRF defense
// (modern browsers won't attach it to a cross-site request at all). This
// double-submit cookie check is defense in depth for older browsers/proxy
// edge cases, and only applies to the two endpoints that authenticate via
// that cookie — everything else uses a Bearer token in the Authorization
// header, which browsers never attach automatically, so it isn't
// CSRF-exposed in the first place.

const CSRF_COOKIE_NAME = "rlp_csrf_token";

function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // the frontend JS must be able to read this to echo it back in a header
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
}

// Verifies the X-CSRF-Token header matches the cookie. Both must be
// present and equal — an attacker's cross-site request can trigger the
// cookie to be sent (defeated by SameSite=strict already, but assume it
// isn't) yet can't read the cookie's value to also set a matching header.
//
// Only enforced when the request is actually relying on the ambient
// refresh-token cookie. A non-browser client (mobile app, server-to-server)
// that passes refreshToken explicitly in the JSON body isn't riding on an
// ambient credential a malicious page could forge, so there's nothing to
// protect there — and requiring a CSRF cookie such clients never received
// would just break them for no security benefit.
function verifyCsrfToken(req, res, next) {
  const usingCookieAuth = !!req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (!usingCookieAuth) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken) {
    return next(new ApiError(403, "Missing CSRF token"));
  }

  const a = Buffer.from(cookieToken);
  const b = Buffer.from(String(headerToken));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return next(new ApiError(403, "Invalid CSRF token"));
  }

  next();
}

module.exports = { CSRF_COOKIE_NAME, issueCsrfToken, verifyCsrfToken };
