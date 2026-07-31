const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { getSignedDownloadUrl } = require("../utils/s3");
const { recordStatusChange, omitFileKey } = require("./document.service");
const lawyerService = require("./lawyer.service");
const notificationService = require("./notification.service");

async function listReviewQueue({ status, page, limit }) {
  const where = { deletedAt: null, status: status ? status : { in: ["PENDING", "UNDER_REVIEW"] } };
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "asc" }, // oldest first — FIFO review queue
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.document.count({ where }),
  ]);
  return { items: items.map(omitFileKey), total, page, limit };
}

async function getDocumentForReview(documentId) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!document || document.deletedAt) throw new ApiError(404, "Document not found");
  const url = await getSignedDownloadUrl(document.fileKey);
  return { ...omitFileKey(document), previewUrl: url };
}

// Lawyer picks up a PENDING document to review — moves it to UNDER_REVIEW
// and assigns themselves as the reviewer so two lawyers can't collide.
async function startReview({ documentId, reviewerUserId }) {
  const lawyerProfile = await lawyerService.getProfileByUserId(reviewerUserId);

  const updated = await prisma.$transaction(async (tx) => {
    const document = await tx.document.findUnique({ where: { id: documentId } });
    if (!document || document.deletedAt) throw new ApiError(404, "Document not found");
    if (document.status !== "PENDING") {
      throw new ApiError(409, `Document is not awaiting review (status: ${document.status})`);
    }

    const result = await tx.document.update({
      where: { id: documentId },
      data: { status: "UNDER_REVIEW", reviewedByLawyerId: lawyerProfile.id },
    });
    await recordStatusChange(tx, {
      documentId,
      fromStatus: "PENDING",
      toStatus: "UNDER_REVIEW",
      changedByUserId: reviewerUserId,
    });
    return result;
  });

  return omitFileKey(updated);
}

// Final decision: VERIFIED / REJECTED / REUPLOAD_REQUIRED. Requires
// `remarks` for anything other than VERIFIED so the user knows what to fix.
async function decideDocument({ documentId, reviewerUserId, status, remarks }) {
  if (status !== "VERIFIED" && !remarks) {
    throw new ApiError(400, "Remarks are required when rejecting or requesting reupload");
  }

  const lawyerProfile = await lawyerService.getProfileByUserId(reviewerUserId);

  const updated = await prisma.$transaction(async (tx) => {
    const document = await tx.document.findUnique({ where: { id: documentId }, include: { user: true } });
    if (!document || document.deletedAt) throw new ApiError(404, "Document not found");
    if (document.status !== "UNDER_REVIEW") {
      throw new ApiError(409, `Document is not under review (status: ${document.status})`);
    }
    if (document.reviewedByLawyerId !== lawyerProfile.id) {
      throw new ApiError(403, "Only the lawyer who started this review can decide it");
    }

    const result = await tx.document.update({
      where: { id: documentId },
      data: { status, remarks: remarks || null, reviewedAt: new Date() },
    });
    await recordStatusChange(tx, {
      documentId,
      fromStatus: "UNDER_REVIEW",
      toStatus: status,
      remarks,
      changedByUserId: reviewerUserId,
    });
    return { ...result, user: document.user };
  });

  const { user, ...document } = updated;
  notificationService
    .notify({
      user,
      type: "DOCUMENT_STATUS_CHANGED",
      data: { category: document.category, status: document.status, remarks: document.remarks },
      channels: ["EMAIL", "WHATSAPP"],
    })
    .catch((err) => console.error(`[verification] notify failed for document ${documentId}:`, err.message));

  return omitFileKey(document);
}

module.exports = { listReviewQueue, getDocumentForReview, startReview, decideDocument };
