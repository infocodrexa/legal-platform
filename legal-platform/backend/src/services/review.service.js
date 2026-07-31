const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { writeAuditLog } = require("../utils/auditLog");
const { sanitizePlainText } = require("../utils/sanitize");

async function createReview({ userId, appointmentId, rating, comment }) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (appointment.userId !== userId) throw new ApiError(403, "This appointment does not belong to you");
  if (appointment.status !== "COMPLETED") {
    throw new ApiError(409, "You can only review a completed appointment");
  }

  const existing = await prisma.review.findUnique({ where: { appointmentId } });
  if (existing) throw new ApiError(409, "You have already reviewed this appointment");

  return prisma.review.create({
    data: {
      appointmentId,
      userId,
      lawyerId: appointment.lawyerId,
      rating,
      comment: comment ? sanitizePlainText(comment) : null,
    },
  });
}

async function listReviewsForLawyer({ lawyerProfileId, page, limit }) {
  const where = { lawyerId: lawyerProfileId, isPublished: true };
  const [items, total, aggregate] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);
  return { items, total, page, limit, averageRating: aggregate._avg.rating || null };
}

async function moderateReview({ reviewId, isPublished, adminUserId }) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(404, "Review not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({ where: { id: reviewId }, data: { isPublished } });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: isPublished ? "REVIEW_PUBLISHED" : "REVIEW_UNPUBLISHED",
      entityType: "Review",
      entityId: reviewId,
    });
    return updated;
  });
}

async function listAllReviews({ isPublished, page, limit }) {
  const where = { ...(isPublished !== undefined && { isPublished }) };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true } },
        lawyerProfile: { select: { id: true, barCouncilId: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function listMine({ userId, page, limit }) {
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { lawyerProfile: { select: { id: true, barCouncilId: true, user: { select: { name: true } } } } },
    }),
    prisma.review.count({ where }),
  ]);
  return { items, total, page, limit };
}

module.exports = { createReview, listReviewsForLawyer, moderateReview, listAllReviews, listMine };
