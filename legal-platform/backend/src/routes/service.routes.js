const express = require("express");
const controller = require("../controllers/service.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  slugParamSchema,
  listPublishedServicesSchema,
  listAllServicesSchema,
} = require("../validators/service.validator");

const router = express.Router();

// Public
router.get("/", validate(listPublishedServicesSchema), controller.listPublished);
router.get("/slug/:slug", validate(slugParamSchema), controller.getBySlug);

// Admin (CMS)
const adminOnly = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];
router.get("/admin", ...adminOnly, validate(listAllServicesSchema), controller.listAllAdmin);
router.get("/admin/:serviceId", ...adminOnly, validate(serviceIdParamSchema), controller.getByIdAdmin);
router.post("/admin", ...adminOnly, upload.single("coverImage"), validate(createServiceSchema), controller.create);
router.put(
  "/admin/:serviceId",
  ...adminOnly,
  upload.single("coverImage"),
  validate(updateServiceSchema),
  controller.update
);
router.delete("/admin/:serviceId", ...adminOnly, validate(serviceIdParamSchema), controller.remove);

module.exports = router;
