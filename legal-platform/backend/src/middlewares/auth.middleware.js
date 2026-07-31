const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const prisma = require("../config/db");

// Requires a valid, non-expired access token. Attaches a minimal, trusted
// req.user object. Re-checks isBanned/deletedAt on every request so a
// banned user's existing access token stops working immediately.
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Missing or malformed Authorization header");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired access token");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.deletedAt) {
      throw new ApiError(401, "Account no longer exists");
    }
    if (user.isBanned) {
      throw new ApiError(403, "Account is banned");
    }

    req.user = { id: user.id, role: user.role, email: user.email, phone: user.phone };
    next();
  } catch (err) {
    next(err);
  }
};

// Optional auth: attaches req.user if a valid token is present, but never
// rejects the request. Useful for GUEST-accessible routes with personalization.
const optionalAuthenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && !user.deletedAt && !user.isBanned) {
      req.user = { id: user.id, role: user.role, email: user.email, phone: user.phone };
    }
  } catch (err) {
    // ignore — treat as unauthenticated
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate };
