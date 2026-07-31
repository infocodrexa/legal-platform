const express = require("express");
const controller = require("../controllers/refund.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  requestRefundSchema,
  refundIdParamSchema,
  rejectRefundSchema,
  listRefundsSchema,
} = require("../validators/refund.validator");

const router = express.Router();

router.use(authenticate);

router.post("/", validate(requestRefundSchema), controller.request);
router.get("/:refundId", validate(refundIdParamSchema), controller.getOne);

router.get("/", authorize("ADMIN", "SUPER_ADMIN"), validate(listRefundsSchema), controller.listAll);
router.post(
  "/:refundId/approve",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(refundIdParamSchema),
  controller.approve
);
router.post(
  "/:refundId/reject",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(rejectRefundSchema),
  controller.reject
);
router.post(
  "/:refundId/process",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(refundIdParamSchema),
  controller.process
);

module.exports = router;
