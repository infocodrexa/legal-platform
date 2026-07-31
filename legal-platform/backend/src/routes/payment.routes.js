const express = require("express");
const controller = require("../controllers/payment.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  createOrderSchema,
  verifyCheckoutSchema,
  paymentIdParamSchema,
  listPaymentsSchema,
} = require("../validators/payment.validator");

const router = express.Router();

// NOTE: POST /webhook is intentionally NOT declared here — it's mounted
// directly on `app` in app.js, before the global JSON body parser, because
// signature verification needs the raw request body. See app.js.

router.use(authenticate);

router.post("/orders", validate(createOrderSchema), controller.createOrder);
router.post("/confirm", validate(verifyCheckoutSchema), controller.confirmCheckout);
router.get("/mine", validate(listPaymentsSchema), controller.listMine);
router.get("/lawyer/mine", authorize("LAWYER"), validate(listPaymentsSchema), controller.listLawyerMine);
router.get("/:paymentId", validate(paymentIdParamSchema), controller.getOne);

module.exports = router;
