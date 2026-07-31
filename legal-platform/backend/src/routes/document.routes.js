// const express = require("express");
// const controller = require("../controllers/document.controller");
// const validate = require("../middlewares/validate");
// const { authenticate } = require("../middlewares/auth.middleware");
// const upload = require("../middlewares/upload.middleware");
// const {
//   uploadDocumentSchema,
//   listDocumentsSchema,
//   documentIdParamSchema,
// } = require("../validators/document.validator");

// const router = express.Router();

// router.use(authenticate);

// router.post("/", upload.single("file"), validate(uploadDocumentSchema), controller.upload);
// router.get("/", validate(listDocumentsSchema), controller.list);
// router.get("/:documentId", validate(documentIdParamSchema), controller.getOne);
// router.get("/:documentId/history", validate(documentIdParamSchema), controller.getHistory);
// router.put(
//   "/:documentId",
//   upload.single("file"),
//   validate(documentIdParamSchema),
//   controller.replace
// );
// router.delete("/:documentId", validate(documentIdParamSchema), controller.remove);

// module.exports = router;

const express = require("express");

const documentController = require("../controllers/document.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const { uploadSingleDocument } = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticate);

// Upload document
router.post("/", uploadSingleDocument, documentController.upload);

// List logged-in user's documents
router.get("/", documentController.list);

// Get document history
router.get("/:documentId/history", documentController.getHistory);

// Generate download URL
router.get("/:documentId/download", documentController.download);

// Preview/document details
router.get("/:documentId", documentController.getOne);

// Replace actual file
router.put("/:documentId", uploadSingleDocument, documentController.replace);

// Edit category/display name
router.patch("/:documentId", documentController.updateMetadata);

// Rename display name
router.patch("/:documentId/rename", documentController.rename);

// Delete document
router.delete("/:documentId", documentController.remove);

module.exports = router;
