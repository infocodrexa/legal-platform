const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");

const {
  uploadPrivateObject,
  getSignedDownloadUrl,
  deletePrivateObject,
} = require("../utils/supabaseStorage");

const MUTABLE_STATUSES = new Set([
  "PENDING",
  "REJECTED",
  "REUPLOAD_REQUIRED",
]);

function omitFileKey(document) {
  if (!document) return document;

  const { fileKey, ...safeDocument } = document;
  return safeDocument;
}

async function recordStatusChange(
  tx,
  {
    documentId,
    fromStatus,
    toStatus,
    remarks,
    changedByUserId,
  }
) {
  return tx.documentStatusHistory.create({
    data: {
      documentId,
      fromStatus,
      toStatus,
      remarks: remarks || null,
      changedByUserId,
    },
  });
}

/**
 * Verify that the document exists, is not deleted,
 * and belongs to the logged-in user.
 */
async function getOwnedDocument(documentId, userId) {
  if (!documentId) {
    throw new ApiError(400, "Document ID is required");
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
  });

  if (!document || document.deletedAt) {
    throw new ApiError(404, "Document not found");
  }

  if (document.userId !== userId) {
    throw new ApiError(
      403,
      "You do not have access to this document"
    );
  }

  return document;
}

/**
 * POST /documents
 * Upload a new document to Supabase Storage.
 */
async function uploadDocument({
  userId,
  category,
  displayName,
  file,
}) {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  if (!category) {
    throw new ApiError(
      400,
      "Document category is required"
    );
  }

  const fileKey = await uploadPrivateObject({
    prefix: "documents",
    userId,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  try {
    const document = await prisma.$transaction(
      async (tx) => {
        const created = await tx.document.create({
          data: {
            userId,
            category,

            /*
             * fileKey now stores the Supabase object path.
             * It does not store a public or signed URL.
             */
            fileKey,

            originalFileName:
              displayName?.trim() ||
              file.originalname,

            mimeType: file.mimetype,
            fileSizeBytes: file.size,
            status: "PENDING",
          },
        });

        await recordStatusChange(tx, {
          documentId: created.id,
          fromStatus: null,
          toStatus: "PENDING",
          remarks: "Document uploaded by user",
          changedByUserId: userId,
        });

        return created;
      }
    );

    return omitFileKey(document);
  } catch (error) {
    /*
     * Database save failed after Supabase upload.
     * Remove the orphaned uploaded file.
     */
    try {
      await deletePrivateObject(fileKey);
    } catch (cleanupError) {
      console.error(
        "Failed to remove orphaned Supabase file:",
        {
          fileKey,
          message: cleanupError.message,
        }
      );
    }

    throw error;
  }
}

/**
 * GET /documents
 * List documents belonging to the logged-in user.
 */
async function listUserDocuments({
  userId,
  status,
  category,
  search,
  page = 1,
  limit = 10,
}) {
  const parsedPage = Math.max(
    Number.parseInt(page, 10) || 1,
    1
  );

  const parsedLimit = Math.min(
    Math.max(Number.parseInt(limit, 10) || 10, 1),
    100
  );

  const where = {
    userId,
    deletedAt: null,

    ...(status && {
      status,
    }),

    ...(category && {
      category,
    }),

    ...(search && {
      OR: [
        {
          originalFileName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),

    prisma.document.count({
      where,
    }),
  ]);

  return {
    items: items.map(omitFileKey),
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit),
  };
}

/**
 * GET /documents/:documentId
 * Return metadata with temporary preview URL.
 */
async function getDocumentWithSignedUrl({
  documentId,
  userId,
}) {
  const document = await getOwnedDocument(
    documentId,
    userId
  );

  const previewUrl = await getSignedDownloadUrl(
    document.fileKey,
    {
      expiresIn: 300,
      download: false,
    }
  );

  return {
    ...omitFileKey(document),
    previewUrl,
    previewUrlExpiresIn: 300,
  };
}

/**
 * GET /documents/:documentId/download
 * Return temporary forced-download URL.
 */
async function getDocumentDownloadUrl({
  documentId,
  userId,
}) {
  const document = await getOwnedDocument(
    documentId,
    userId
  );

  const downloadUrl = await getSignedDownloadUrl(
    document.fileKey,
    {
      expiresIn: 300,
      download: document.originalFileName,
    }
  );

  return {
    documentId: document.id,
    fileName: document.originalFileName,
    mimeType: document.mimeType,
    fileSizeBytes: document.fileSizeBytes,
    downloadUrl,
    expiresIn: 300,
  };
}

/**
 * GET /documents/:documentId/history
 */
async function getDocumentHistory({
  documentId,
  userId,
}) {
  await getOwnedDocument(documentId, userId);

  return prisma.documentStatusHistory.findMany({
    where: {
      documentId,
    },
    orderBy: {
      changedAt: "asc",
    },
    take: 500,
  });
}

/**
 * PUT /documents/:documentId
 * Replace the actual file.
 */
async function replaceDocument({
  documentId,
  userId,
  category,
  displayName,
  file,
}) {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  const existingDocument = await getOwnedDocument(
    documentId,
    userId
  );

  if (!MUTABLE_STATUSES.has(existingDocument.status)) {
    throw new ApiError(
      409,
      `Cannot replace a document with status ${existingDocument.status}`
    );
  }

  /*
   * Upload the new file first. The old file remains
   * available if the new upload fails.
   */
  const newFileKey = await uploadPrivateObject({
    prefix: "documents",
    userId,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  let updatedDocument;

  try {
    updatedDocument = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.document.update({
          where: {
            id: documentId,
          },
          data: {
            fileKey: newFileKey,

            originalFileName:
              displayName?.trim() ||
              file.originalname,

            mimeType: file.mimetype,
            fileSizeBytes: file.size,

            ...(category && {
              category,
            }),

            status: "PENDING",
            remarks: null,
            reviewedByLawyerId: null,
            reviewedAt: null,
          },
        });

        await recordStatusChange(tx, {
          documentId,
          fromStatus: existingDocument.status,
          toStatus: "PENDING",
          remarks: "Document replaced by user",
          changedByUserId: userId,
        });

        return updated;
      }
    );
  } catch (error) {
    /*
     * Database update failed, so remove the newly
     * uploaded orphaned file.
     */
    try {
      await deletePrivateObject(newFileKey);
    } catch (cleanupError) {
      console.error(
        "Failed to remove replacement file:",
        {
          fileKey: newFileKey,
          message: cleanupError.message,
        }
      );
    }

    throw error;
  }

  /*
   * Database now points to the new file.
   * Delete the previous Supabase object afterward.
   */
  try {
    await deletePrivateObject(existingDocument.fileKey);
  } catch (cleanupError) {
    console.error(
      "Old Supabase document could not be deleted:",
      {
        documentId,
        fileKey: existingDocument.fileKey,
        message: cleanupError.message,
      }
    );
  }

  return omitFileKey(updatedDocument);
}

/**
 * PATCH /documents/:documentId
 * Update category and/or display name without
 * replacing the actual file.
 */
async function updateDocumentMetadata({
  documentId,
  userId,
  category,
  displayName,
}) {
  const document = await getOwnedDocument(
    documentId,
    userId
  );

  if (!MUTABLE_STATUSES.has(document.status)) {
    throw new ApiError(
      409,
      `Cannot edit a document with status ${document.status}`
    );
  }

  const updateData = {};

  if (category !== undefined) {
    const normalizedCategory = String(category).trim();

    if (!normalizedCategory) {
      throw new ApiError(
        400,
        "Document category cannot be empty"
      );
    }

    updateData.category = normalizedCategory;
  }

  if (displayName !== undefined) {
    const normalizedDisplayName =
      String(displayName).trim();

    if (!normalizedDisplayName) {
      throw new ApiError(
        400,
        "Document display name cannot be empty"
      );
    }

    updateData.originalFileName =
      normalizedDisplayName;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(
      400,
      "Provide category or displayName to update"
    );
  }

  const updated = await prisma.document.update({
    where: {
      id: documentId,
    },
    data: updateData,
  });

  return omitFileKey(updated);
}

/**
 * PATCH /documents/:documentId/rename
 */
async function renameDocument({
  documentId,
  userId,
  displayName,
}) {
  const document = await getOwnedDocument(
    documentId,
    userId
  );

  if (!MUTABLE_STATUSES.has(document.status)) {
    throw new ApiError(
      409,
      `Cannot rename a document with status ${document.status}`
    );
  }

  const normalizedDisplayName =
    String(displayName || "").trim();

  if (!normalizedDisplayName) {
    throw new ApiError(
      400,
      "Document display name is required"
    );
  }

  const updated = await prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      /*
       * This changes only the name displayed in the
       * application. Supabase object path is unchanged.
       */
      originalFileName: normalizedDisplayName,
    },
  });

  return omitFileKey(updated);
}

/**
 * DELETE /documents/:documentId
 * Soft-delete DB row and remove active Supabase object.
 */
async function deleteDocument({
  documentId,
  userId,
}) {
  const document = await getOwnedDocument(
    documentId,
    userId
  );

  if (!MUTABLE_STATUSES.has(document.status)) {
    throw new ApiError(
      409,
      `Cannot delete a document with status ${document.status}`
    );
  }

  /*
   * Soft-delete the database record first so it becomes
   * inaccessible even if storage cleanup temporarily fails.
   */
  await prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  try {
    await deletePrivateObject(document.fileKey);
  } catch (error) {
    console.error(
      "Supabase document cleanup failed:",
      {
        documentId,
        fileKey: document.fileKey,
        message: error.message,
      }
    );
  }

  return {
    documentId,
    deleted: true,
  };
}

module.exports = {
  uploadDocument,
  listUserDocuments,
  getOwnedDocument,
  getDocumentWithSignedUrl,
  getDocumentDownloadUrl,
  getDocumentHistory,
  replaceDocument,
  updateDocumentMetadata,
  renameDocument,
  deleteDocument,
  recordStatusChange,
  omitFileKey,
  MUTABLE_STATUSES,
};