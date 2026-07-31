// const express = require("express");
// const controller = require("../controllers/blog.controller");
// const validate = require("../middlewares/validate");
// const { authenticate } = require("../middlewares/auth.middleware");
// const { authorize } = require("../middlewares/rbac.middleware");
// const upload = require("../middlewares/upload.middleware");
// const {
//   createBlogSchema,
//   updateBlogSchema,
//   blogIdParamSchema,
//   slugParamSchema,
//   publishBlogSchema,
//   listPublishedBlogsSchema,
//   listAllBlogsSchema,
// } = require("../validators/blog.validator");

// const router = express.Router();

// // Public
// router.get("/", validate(listPublishedBlogsSchema), controller.listPublished);
// router.get("/slug/:slug", validate(slugParamSchema), controller.getBySlug);

// // Admin (CMS)
// const adminOnly = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];
// router.get("/admin", ...adminOnly, validate(listAllBlogsSchema), controller.listAllAdmin);
// router.get("/admin/:blogId", ...adminOnly, validate(blogIdParamSchema), controller.getByIdAdmin);
// router.post("/admin", ...adminOnly, upload.single("coverImage"), validate(createBlogSchema), controller.create);
// router.put(
//   "/admin/:blogId",
//   ...adminOnly,
//   upload.single("coverImage"),
//   validate(updateBlogSchema),
//   controller.update
// );
// router.patch("/admin/:blogId/publish", ...adminOnly, validate(publishBlogSchema), controller.publish);
// router.delete("/admin/:blogId", ...adminOnly, validate(blogIdParamSchema), controller.remove);

// module.exports = router;




const express = require("express");
const controller = require("../controllers/blog.controller");
const validate = require("../middlewares/validate");

const {
  authenticate,
} = require("../middlewares/auth.middleware");

const {
  authorize,
} = require("../middlewares/rbac.middleware");

const {
  uploadBlogCoverImage,
} = require("../middlewares/upload.middleware");

const {
  createBlogSchema,
  updateBlogSchema,
  blogIdParamSchema,
  slugParamSchema,
  publishBlogSchema,
  listPublishedBlogsSchema,
  listAllBlogsSchema,
} = require("../validators/blog.validator");

const router = express.Router();

// Public
router.get(
  "/",
  validate(listPublishedBlogsSchema),
  controller.listPublished
);

router.get(
  "/slug/:slug",
  validate(slugParamSchema),
  controller.getBySlug
);

// Admin
const adminOnly = [
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
];

router.get(
  "/admin",
  ...adminOnly,
  validate(listAllBlogsSchema),
  controller.listAllAdmin
);

router.get(
  "/admin/:blogId",
  ...adminOnly,
  validate(blogIdParamSchema),
  controller.getByIdAdmin
);

router.post(
  "/admin",
  ...adminOnly,
  uploadBlogCoverImage,
  validate(createBlogSchema),
  controller.create
);

router.put(
  "/admin/:blogId",
  ...adminOnly,
  uploadBlogCoverImage,
  validate(updateBlogSchema),
  controller.update
);

router.patch(
  "/admin/:blogId/publish",
  ...adminOnly,
  validate(publishBlogSchema),
  controller.publish
);

router.delete(
  "/admin/:blogId",
  ...adminOnly,
  validate(blogIdParamSchema),
  controller.remove
);

module.exports = router;