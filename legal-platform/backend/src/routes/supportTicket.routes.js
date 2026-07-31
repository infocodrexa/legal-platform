const express = require("express");
const controller = require("../controllers/supportTicket.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  createTicketSchema,
  ticketIdParamSchema,
  replySchema,
  updateStatusSchema,
  assignSchema,
  listTicketsSchema,
} = require("../validators/supportTicket.validator");

const router = express.Router();

router.use(authenticate);

router.post("/", validate(createTicketSchema), controller.create);
router.get("/mine", validate(listTicketsSchema), controller.listMine);
router.get("/:ticketId", validate(ticketIdParamSchema), controller.getOne);
router.post("/:ticketId/replies", validate(replySchema), controller.reply);

router.get("/", authorize("ADMIN", "SUPER_ADMIN"), validate(listTicketsSchema), controller.listAll);
router.patch(
  "/:ticketId/status",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(updateStatusSchema),
  controller.updateStatus
);
router.patch(
  "/:ticketId/assign",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(assignSchema),
  controller.assign
);

module.exports = router;
