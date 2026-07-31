const express = require("express");
const controller = require("../controllers/media.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const { listMediaSchema, mediaIdParamSchema } = require("../validators/media.validator");

const router = express.Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/", validate(listMediaSchema), controller.list);
router.get("/contexts", controller.contexts);
router.get("/:mediaAssetId", validate(mediaIdParamSchema), controller.getOne);
router.delete("/:mediaAssetId", validate(mediaIdParamSchema), controller.remove);

module.exports = router;
