const express = require("express");
const controller = require("../controllers/messageTemplate.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  upsertTemplateSchema,
  templateIdParamSchema,
  listTemplatesSchema,
  previewTemplateSchema,
} = require("../validators/messageTemplate.validator");

const router = express.Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/", validate(listTemplatesSchema), controller.list);
router.post("/", validate(upsertTemplateSchema), controller.upsert);
router.post("/preview", validate(previewTemplateSchema), controller.preview);
router.delete("/:templateId", validate(templateIdParamSchema), controller.remove);

module.exports = router;
