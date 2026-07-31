const express = require("express");
const controller = require("../controllers/lead.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const { createLeadSchema, updateLeadSchema, leadIdParamSchema, listLeadsSchema } = require("../validators/lead.validator");

const router = express.Router();

// Public — this is what the frontend contact form actually submits to.
// Rate-limited (reusing the strict auth limiter) since it's an
// unauthenticated, spam-prone endpoint.
router.post("/", authLimiter, validate(createLeadSchema), controller.create);

// Admin
router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));
router.get("/", validate(listLeadsSchema), controller.list);
router.get("/:leadId", validate(leadIdParamSchema), controller.getOne);
router.patch("/:leadId", validate(updateLeadSchema), controller.update);

module.exports = router;
