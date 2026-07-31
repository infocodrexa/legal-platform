const { ApiError } = require("../utils/apiResponse");

// Usage: router.get("/admin/x", authenticate, authorize("ADMIN", "SUPER_ADMIN"), handler)
// Every route in the platform must declare its allowed roles explicitly —
// there is no implicit "any authenticated user" fallthrough for
// role-sensitive routes.
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  next();
};

module.exports = { authorize };
