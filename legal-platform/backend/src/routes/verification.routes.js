const express = require("express");
const controller = require("../controllers/verification.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  listQueueSchema,
  documentIdParamSchema,
  decisionSchema,
} = require("../validators/verification.validator");

const router = express.Router();

router.use(authenticate, authorize("LAWYER", "ADMIN", "SUPER_ADMIN"));

router.get("/queue", validate(listQueueSchema), controller.listQueue);
router.get("/:documentId", validate(documentIdParamSchema), controller.getOne);
router.post("/:documentId/start", validate(documentIdParamSchema), controller.startReview);
router.post("/:documentId/decision", validate(decisionSchema), controller.decide);

module.exports = router;
