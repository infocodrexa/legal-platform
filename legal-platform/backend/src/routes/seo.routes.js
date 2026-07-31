const express = require("express");
const controller = require("../controllers/seo.controller");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const upload = require("../middlewares/upload.middleware");
const { upsertSeoMetaSchema, pathQuerySchema, seoIdParamSchema, listSeoMetaSchema } = require("../validators/seo.validator");

const router = express.Router();

// Public — frontend fetches meta tags for a given route by path.
router.get("/", validate(pathQuerySchema), controller.getByPath);

const adminOnly = [authenticate, authorize("ADMIN", "SUPER_ADMIN")];
router.get("/admin", ...adminOnly, validate(listSeoMetaSchema), controller.listAllAdmin);
router.post("/admin", ...adminOnly, upload.single("ogImage"), validate(upsertSeoMetaSchema), controller.upsert);
router.delete("/admin/:seoMetaId", ...adminOnly, validate(seoIdParamSchema), controller.remove);

module.exports = router;
