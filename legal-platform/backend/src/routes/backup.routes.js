const express = require("express");
const controller = require("../controllers/backup.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const { listBackupsSchema, backupIdParamSchema, requestRestoreSchema } = require("../validators/backup.validator");

const router = express.Router();

// SUPER_ADMIN only, not plain ADMIN — a full database export (including
// every password hash) is about as sensitive as data gets on this
// platform. Restricting this more tightly than the rest of the admin
// surface is deliberate, not an oversight.
router.use(authenticate, authorize("SUPER_ADMIN"));

router.post("/", controller.trigger);
router.get("/", validate(listBackupsSchema), controller.list);
router.get("/:backupId/download", validate(backupIdParamSchema), controller.download);
router.post("/:backupId/request-restore", validate(requestRestoreSchema), controller.requestRestore);

module.exports = router;
