const express = require("express");
const controller = require("../controllers/admin.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  listUsersSchema,
  userIdParamSchema,
  banUserSchema,
  revenueQuerySchema,
  listLawyersSchema,
  listPaymentsSchema,
  listDocumentsSchema,
  listAppointmentsSchema,
  listAuditLogsSchema,
   // Activity Timeline
  listActivityEventsSchema,
  activityEventIdParamSchema,
} = require("../validators/admin.validator");
const { lawyerProfileIdParamSchema } = require("../validators/lawyer.validator");

const router = express.Router();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/analytics/overview", controller.overview);
router.get("/analytics/revenue", validate(revenueQuerySchema), controller.revenue);

router.get("/users", validate(listUsersSchema), controller.listUsers);
router.get("/users/:userId", validate(userIdParamSchema), controller.getUser);
router.patch("/users/:userId/ban", validate(banUserSchema), controller.banUser);
router.post("/users/:userId/force-logout", validate(userIdParamSchema), controller.forceLogout);

router.get("/lawyers", validate(listLawyersSchema), controller.listLawyers);
router.get("/lawyers/:lawyerProfileId", validate(lawyerProfileIdParamSchema), controller.getLawyer);
router.get("/payments", validate(listPaymentsSchema), controller.listPayments);
router.get("/documents", validate(listDocumentsSchema), controller.listDocuments);
router.get("/appointments", validate(listAppointmentsSchema), controller.listAppointments);
router.get("/audit-logs", validate(listAuditLogsSchema), controller.listAuditLogs);

router.get(
  "/activity-events",
  validate(listActivityEventsSchema),
  controller.listActivityEvents
);

router.get(
  "/activity-events/:activityEventId",
  validate(activityEventIdParamSchema),
  controller.getActivityEvent
);

module.exports = router;
