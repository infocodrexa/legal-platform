const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const documentService = require("../services/document.service");

/**
 * POST /api/v1/documents
 * Upload a new document
 */
const upload = asyncHandler(async (req, res) => {
  const document = await documentService.uploadDocument({
    userId: req.user.id,
    userRole: req.user.role,
    category: req.body.category,
    displayName: req.body.displayName,
    file: req.file,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Document uploaded successfully.",
    data: document,
  });
});

/**
 * GET /api/v1/documents
 * List logged-in user's documents
 */
const list = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const result =
    await documentService.listUserDocuments({
      userId: req.user.id,
      userRole: req.user.role,
      status,
      category,
      search,
      page,
      limit,
    });

  sendSuccess(res, {
    message: "Documents fetched successfully.",
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

/**
 * GET /api/v1/documents/:documentId
 * Get document details with temporary signed preview URL
 */
const getOne = asyncHandler(async (req, res) => {
  const document =
    await documentService.getDocumentWithSignedUrl({
      documentId: req.params.documentId,
      userId: req.user.id,
      userRole: req.user.role,
    });

  sendSuccess(res, {
    message: "Document fetched successfully.",
    data: document,
  });
});

/**
 * GET /api/v1/documents/:documentId/download
 * Get a temporary download URL
 */
const download = asyncHandler(async (req, res) => {
  const result =
    await documentService.getDocumentDownloadUrl({
      documentId: req.params.documentId,
      userId: req.user.id,
      userRole: req.user.role,
    });

  sendSuccess(res, {
    message: "Download URL generated successfully.",
    data: result,
  });
});

/**
 * GET /api/v1/documents/:documentId/history
 * Get all document replacement/version history
 */
const getHistory = asyncHandler(async (req, res) => {
  const history =
    await documentService.getDocumentHistory({
      documentId: req.params.documentId,
      userId: req.user.id,
      userRole: req.user.role,
    });

  sendSuccess(res, {
    message: "Document history fetched successfully.",
    data: history,
  });
});

/**
 * PUT /api/v1/documents/:documentId
 * Replace existing document file
 */
const replace = asyncHandler(async (req, res) => {
  const document =
    await documentService.replaceDocument({
      documentId: req.params.documentId,
      userId: req.user.id,
      userRole: req.user.role,
      category: req.body.category,
      displayName: req.body.displayName,
      file: req.file,
    });

  sendSuccess(res, {
    message:
      "Document replaced successfully. Verification status has been reset to PENDING.",
    data: document,
  });
});

/**
 * PATCH /api/v1/documents/:documentId
 * Edit document metadata without replacing the actual file
 */
const updateMetadata = asyncHandler(async (req, res) => {
  const document =
    await documentService.updateDocumentMetadata({
      documentId: req.params.documentId,
      userId: req.user.id,
      userRole: req.user.role,
      category: req.body.category,
      displayName: req.body.displayName,
    });

  sendSuccess(res, {
    message: "Document details updated successfully.",
    data: document,
  });
});

/**
 * PATCH /api/v1/documents/:documentId/rename
 * Rename document display name
 */
const rename = asyncHandler(async (req, res) => {
  const document =
    await documentService.renameDocument({
      documentId: req.params.documentId,
      userId: req.user.id,
      userRole: req.user.role,
      displayName: req.body.displayName,
    });

  sendSuccess(res, {
    message: "Document renamed successfully.",
    data: document,
  });
});

/**
 * DELETE /api/v1/documents/:documentId
 * Delete document from Supabase Storage and database
 */
const remove = asyncHandler(async (req, res) => {
  await documentService.deleteDocument({
    documentId: req.params.documentId,
    userId: req.user.id,
    userRole: req.user.role,
  });

  sendSuccess(res, {
    message: "Document deleted successfully.",
  });
});

module.exports = {
  upload,
  list,
  getOne,
  download,
  getHistory,
  replace,
  updateMetadata,
  rename,
  remove,
};