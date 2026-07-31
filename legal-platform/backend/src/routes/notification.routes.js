// const express = require("express");
// const controller = require("../controllers/notification.controller");
// const validate = require("../middlewares/validate");
// const { authenticate } = require("../middlewares/auth.middleware");
// const { authorize } = require("../middlewares/rbac.middleware");
// const { listNotificationsSchema, notificationIdSchema, preferenceSchema, adminSendSchema } = require("../validators/notification.validator");
// const router = express.Router();
// router.use(authenticate);
// router.get("/mine", validate(listNotificationsSchema), controller.listMine);
// router.patch("/mine/read-all", controller.markAllRead);
// router.patch("/:notificationId/read", validate(notificationIdSchema), controller.markRead);
// router.get("/preferences", controller.getPreferences);
// router.patch("/preferences", validate(preferenceSchema), controller.updatePreferences);
// router.post("/admin/send", authorize("ADMIN", "SUPER_ADMIN"), validate(adminSendSchema), controller.adminSend);
// module.exports = router;



const express = require("express");

const controller = require(
  "../controllers/notification.controller"
);

const validate = require(
  "../middlewares/validate"
);

const {
  authenticate,
} = require(
  "../middlewares/auth.middleware"
);

const {
  authorize,
} = require(
  "../middlewares/rbac.middleware"
);

const {
  listNotificationsSchema,
  notificationIdSchema,
  preferenceSchema,
  adminSendSchema,
} = require(
  "../validators/notification.validator"
);

const router = express.Router();

// Iske neeche ke sabhi routes login require karenge
router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Logged-in user notifications
|--------------------------------------------------------------------------
*/

// Notification list
router.get(
  "/mine",
  validate(listNotificationsSchema),
  controller.listMine
);

// Sabhi notifications ko read mark karna
router.patch(
  "/mine/read-all",
  controller.markAllRead
);

// Sirf read notifications delete karna
router.delete(
  "/mine/read",
  controller.deleteReadMine
);

// Logged-in user ki sabhi in-app notifications delete karna
router.delete(
  "/mine",
  controller.deleteAllMine
);

/*
|--------------------------------------------------------------------------
| Single notification actions
|--------------------------------------------------------------------------
*/

// Ek notification ko read mark karna
router.patch(
  "/:notificationId/read",
  validate(notificationIdSchema),
  controller.markRead
);

// Ek notification ko unread mark karna
router.patch(
  "/:notificationId/unread",
  validate(notificationIdSchema),
  controller.markUnread
);

// Ek notification delete karna
router.delete(
  "/:notificationId",
  validate(notificationIdSchema),
  controller.deleteNotification
);

/*
|--------------------------------------------------------------------------
| Notification preferences
|--------------------------------------------------------------------------
*/

router.get(
  "/preferences",
  controller.getPreferences
);

router.patch(
  "/preferences",
  validate(preferenceSchema),
  controller.updatePreferences
);

/*
|--------------------------------------------------------------------------
| Admin notification
|--------------------------------------------------------------------------
*/

router.post(
  "/admin/send",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(adminSendSchema),
  controller.adminSend
);

module.exports = router;