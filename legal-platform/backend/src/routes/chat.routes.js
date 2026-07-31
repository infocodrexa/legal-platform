// const express = require("express");
// const controller = require("../controllers/chat.controller");
// const validate = require("../middlewares/validate");
// const { authenticate } = require("../middlewares/auth.middleware");
// const upload = require("../middlewares/upload.middleware");
// const { appointmentIdParamSchema, listMessagesSchema } = require("../validators/chat.validator");

// const router = express.Router();

// router.use(authenticate);

// router.get("/:appointmentId/messages", validate(listMessagesSchema), controller.listHistory);
// router.post(
//   "/:appointmentId/attachments",
//   upload.single("file"),
//   validate(appointmentIdParamSchema),
//   controller.uploadAttachment
// );

// module.exports = router;




const express = require("express");
const controller = require("../controllers/chat.controller");
const validate = require("../middlewares/validate");

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const {
  uploadSingleDocument,
} = require("../middlewares/upload.middleware");

const {
  appointmentIdParamSchema,
  listMessagesSchema,
} = require("../validators/chat.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/:appointmentId/messages",
  validate(listMessagesSchema),
  controller.listHistory
);

router.post(
  "/:appointmentId/attachments",
  uploadSingleDocument,
  validate(appointmentIdParamSchema),
  controller.uploadAttachment
);

module.exports = router;