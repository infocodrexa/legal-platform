const express = require("express");
const controller = require("../controllers/lawyer.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  upsertProfileSchema,
  kycDecisionSchema,
  setWorkingHoursSchema,
  generateSlotsSchema,
  listSlotsSchema,
  availabilityCalendarSchema,
  setRazorpayAccountSchema,
  listPublicDirectorySchema,
  lawyerProfileIdParamSchema,
} = require("../validators/lawyer.validator");

const router = express.Router();

// Public lawyer directory — completes the frontend's existing directory
// page. Must be registered before /:lawyerProfileId/slots so "profile" in
// GET /profile/me isn't shadowed, and before any :lawyerProfileId route
// that isn't meant to be public.
router.get("/", validate(listPublicDirectorySchema), controller.listPublicDirectory);
router.get("/:lawyerProfileId/public", validate(lawyerProfileIdParamSchema), controller.getPublicProfile);

// Any authenticated user can create/update their own lawyer profile — the
// account is promoted to role=LAWYER on first successful creation.
router.post(
  "/profile",
  authenticate,
  upload.uploadKycDocs,
  validate(upsertProfileSchema),
  controller.upsertProfile
);

router.get("/profile/me", authenticate, authorize("LAWYER"), controller.getMyProfile);

router.get(
  "/:lawyerProfileId/admin",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(lawyerProfileIdParamSchema),
  controller.getProfileForAdmin
);

router.patch(
  "/:lawyerProfileId/kyc",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(kycDecisionSchema),
  controller.decideKyc
);

// Links a lawyer's Razorpay Route linked account for direct payout
// settlement (compliance spec Sec 2.1/2.3) — only allowed once KYC is
// VERIFIED (enforced in the service layer). Stored encrypted at rest.
router.patch(
  "/:lawyerProfileId/razorpay-account",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(setRazorpayAccountSchema),
  controller.setRazorpayAccount
);

router.put(
  "/working-hours",
  authenticate,
  authorize("LAWYER"),
  validate(setWorkingHoursSchema),
  controller.setWorkingHours
);

router.post(
  "/slots/generate",
  authenticate,
  authorize("LAWYER"),
  validate(generateSlotsSchema),
  controller.generateSlots
);

router.get(
  "/:lawyerProfileId/availability-calendar",
  validate(availabilityCalendarSchema),
  controller.availabilityCalendar
);

// Public browsing of a lawyer's open slots (USER/GUEST need this to book).
router.get("/:lawyerProfileId/slots", validate(listSlotsSchema), controller.listAvailableSlots);

module.exports = router;
