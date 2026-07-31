const express = require("express");
const controller = require("../controllers/faq.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  createFaqSchema,
  updateFaqSchema,
  faqIdParamSchema,
  listPublicFaqSchema,
  listAllFaqSchema,
} = require("../validators/faq.validator");

const router = express.Router();

router.get("/", validate(listPublicFaqSchema), controller.listPublic);

const adminOnly = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];
router.get("/admin", ...adminOnly, validate(listAllFaqSchema), controller.listAllAdmin);
router.post("/admin", ...adminOnly, validate(createFaqSchema), controller.create);
router.put("/admin/:faqId", ...adminOnly, validate(updateFaqSchema), controller.update);
router.delete("/admin/:faqId", ...adminOnly, validate(faqIdParamSchema), controller.remove);

module.exports = router;
