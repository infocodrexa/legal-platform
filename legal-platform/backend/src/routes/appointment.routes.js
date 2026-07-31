const express = require("express");
const controller = require("../controllers/appointment.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  bookAppointmentSchema,
  appointmentIdParamSchema,
  respondSchema,
  cancelSchema,
  rescheduleSchema,
  listAppointmentsSchema,
} = require("../validators/appointment.validator");

const router = express.Router();

router.use(authenticate);

router.post("/", validate(bookAppointmentSchema), controller.book);
router.get("/mine", validate(listAppointmentsSchema), controller.listMine);
router.get(
  "/lawyer/mine",
  authorize("LAWYER"),
  validate(listAppointmentsSchema),
  controller.listAsLawyer
);
router.get("/:appointmentId", validate(appointmentIdParamSchema), controller.getOne);
router.post(
  "/:appointmentId/respond",
  authorize("LAWYER"),
  validate(respondSchema),
  controller.respond
);
router.post("/:appointmentId/cancel", validate(cancelSchema), controller.cancel);
router.post(
  "/:appointmentId/complete",
  authorize("LAWYER"),
  validate(appointmentIdParamSchema),
  controller.complete
);
router.post("/:appointmentId/reschedule", validate(rescheduleSchema), controller.reschedule);

module.exports = router;
