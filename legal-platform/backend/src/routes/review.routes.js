const express = require("express");
const controller = require("../controllers/review.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const {
  createReviewSchema,
  reviewIdParamSchema,
  listByLawyerSchema,
  moderateReviewSchema,
  listAllReviewsSchema,
} = require("../validators/review.validator");

const router = express.Router();

// Public — anyone can read published reviews for a lawyer.
router.get("/lawyer/:lawyerProfileId", validate(listByLawyerSchema), controller.listForLawyer);

router.post("/", authenticate, validate(createReviewSchema), controller.create);

router.get("/mine", authenticate, validate(listAllReviewsSchema), controller.listMine);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(listAllReviewsSchema),
  controller.listAll
);
router.patch(
  "/:reviewId/moderate",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(moderateReviewSchema),
  controller.moderate
);

module.exports = router;
