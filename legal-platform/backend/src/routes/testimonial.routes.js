const express = require("express");
const controller = require("../controllers/testimonial.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  createTestimonialSchema,
  updateTestimonialSchema,
  testimonialIdParamSchema,
  listAllTestimonialsSchema,
} = require("../validators/testimonial.validator");

const router = express.Router();

router.get("/", controller.listPublic);

const adminOnly = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];
router.get("/admin", ...adminOnly, validate(listAllTestimonialsSchema), controller.listAllAdmin);
router.post(
  "/admin",
  ...adminOnly,
  upload.single("avatar"),
  validate(createTestimonialSchema),
  controller.create
);
router.put(
  "/admin/:testimonialId",
  ...adminOnly,
  upload.single("avatar"),
  validate(updateTestimonialSchema),
  controller.update
);
router.delete("/admin/:testimonialId", ...adminOnly, validate(testimonialIdParamSchema), controller.remove);

module.exports = router;
