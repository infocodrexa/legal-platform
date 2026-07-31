const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { writeAuditLog } = require("../utils/auditLog");

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isVerified: true,
  isBanned: true,
  createdAt: true,
};

// ----------------------------------------------------------------------
// Analytics
// ----------------------------------------------------------------------
async function getOverview() {
  const [
    totalUsers,
    totalLawyers,
    verifiedLawyers,
    pendingKyc,
    appointmentCounts,
    pendingDocuments,
    openTickets,
    revenueAgg,
    refundAgg,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.lawyerProfile.count({ where: { deletedAt: null } }),
    prisma.lawyerProfile.count({ where: { deletedAt: null, kycStatus: "VERIFIED" } }),
    prisma.lawyerProfile.count({ where: { deletedAt: null, kycStatus: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.document.count({ where: { deletedAt: null, status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.payment.aggregate({
      where: { status: { in: ["CAPTURED", "SETTLED"] } },
      _sum: { amount: true, platformCommission: true, lawyerPayout: true },
      _count: { _all: true },
    }),
    prisma.refund.aggregate({
      where: { status: "PROCESSED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const appointmentsByStatus = Object.fromEntries(appointmentCounts.map((row) => [row.status, row._count._all]));

  return {
    totalUsers,
    totalLawyers,
    verifiedLawyers,
    pendingKyc,
    appointmentsByStatus,
    pendingDocuments,
    openSupportTickets: openTickets,
    revenue: {
      totalCaptured: revenueAgg._sum.amount || 0,
      totalPlatformCommission: revenueAgg._sum.platformCommission || 0,
      totalLawyerPayout: revenueAgg._sum.lawyerPayout || 0,
      transactionCount: revenueAgg._count._all,
    },
    refunds: {
      totalRefunded: refundAgg._sum.amount || 0,
      refundCount: refundAgg._count._all,
    },
  };
}

// Grouped in application code rather than raw SQL date_trunc, since Prisma
// doesn't support that portably across providers. Fine at moderate volume;
// worth moving to a raw query or materialized view if this dataset grows
// large enough for the in-memory grouping to matter.
async function getRevenueOverTime({ from, to, groupBy }) {
  const where = { status: { in: ["CAPTURED", "SETTLED"] } };
  if (from || to) {
    where.capturedAt = {};
    if (from) where.capturedAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.capturedAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const payments = await prisma.payment.findMany({
    where,
    select: { capturedAt: true, amount: true, platformCommission: true, lawyerPayout: true },
    orderBy: { capturedAt: "asc" },
    take: 50000, // safety net for an all-time query with no from/to given
  });

  const buckets = new Map();
  for (const p of payments) {
    if (!p.capturedAt) continue;
    const iso = p.capturedAt.toISOString();
    const key = groupBy === "month" ? iso.slice(0, 7) : iso.slice(0, 10); // "YYYY-MM" or "YYYY-MM-DD"
    const bucket = buckets.get(key) || { period: key, revenue: 0, commission: 0, payout: 0, count: 0 };
    bucket.revenue += Number(p.amount);
    bucket.commission += Number(p.platformCommission);
    bucket.payout += Number(p.lawyerPayout);
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period));
}

// ----------------------------------------------------------------------
// User management
// ----------------------------------------------------------------------
async function listUsers({ role, isBanned, search, page, limit }) {
  const where = {
    deletedAt: null,
    ...(role && { role }),
    ...(isBanned !== undefined && { isBanned }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  if (!user) throw new ApiError(404, "User not found");

  const [appointmentCount, documentCount, lawyerProfile] = await Promise.all([
    prisma.appointment.count({ where: { userId } }),
    prisma.document.count({ where: { userId, deletedAt: null } }),
    prisma.lawyerProfile.findUnique({
      where: { userId },
      select: { id: true, kycStatus: true, barCouncilId: true, consultationCharge: true },
    }),
  ]);

  return { ...user, appointmentCount, documentCount, lawyerProfile };
}

async function setBanStatus({ userId, isBanned, reason, adminUserId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw new ApiError(403, "Cannot ban an admin account through this endpoint");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { isBanned },
      select: SAFE_USER_SELECT,
    });
    if (isBanned) {
      // Banning takes effect immediately — kill every active session.
      await tx.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    }
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: isBanned ? "USER_BANNED" : "USER_UNBANNED",
      entityType: "User",
      entityId: userId,
      metadata: { reason: reason || null },
    });
    return updated;
  });
}

async function forceLogout({ userId, adminUserId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  return prisma.$transaction(async (tx) => {
    const result = await tx.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "USER_FORCE_LOGOUT",
      entityType: "User",
      entityId: userId,
      metadata: { sessionsRevoked: result.count },
    });
    return { sessionsRevoked: result.count };
  });
}

// ----------------------------------------------------------------------
// Lawyer management (list/browse — KYC decision itself lives in
// lawyer.routes.js since it's already admin-gated there)
// ----------------------------------------------------------------------
async function listLawyers({ kycStatus, page, limit }) {
  const where = { deletedAt: null, ...(kycStatus && { kycStatus }) };
  const [items, total] = await Promise.all([
    prisma.lawyerProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        barCouncilId: true,
        kycStatus: true,
        consultationCharge: true,
        experienceYears: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.lawyerProfile.count({ where }),
  ]);
  return { items, total, page, limit };
}

// ----------------------------------------------------------------------
// Payments (admin-wide view — /payments/mine only shows the caller's own)
// ----------------------------------------------------------------------
async function listAllPayments({ status, page, limit }) {
  const where = { ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        amount: true,
        platformCommission: true,
        lawyerPayout: true,
        currency: true,
        status: true,
        createdAt: true,
        capturedAt: true,
        settledAt: true,
        user: { select: { id: true, name: true, email: true } },
        lawyerProfile: { select: { id: true, barCouncilId: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);
  return { items, total, page, limit };
}

// ----------------------------------------------------------------------
// Audit log read access
// ----------------------------------------------------------------------
async function listAuditLogs({ entityType, action, actorUserId, page, limit }) {
  const where = {
    ...(entityType && { entityType }),
    ...(action && { action }),
    ...(actorUserId && { actorUserId }),
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { actorUser: { select: { id: true, name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, limit };
}

// ----------------------------------------------------------------------
// Document oversight (read-only — verification decisions happen in
// verification.routes.js, which is where that responsibility already
// lives; this is purely a platform-wide browse view)
// ----------------------------------------------------------------------
async function listAllDocuments({ status, category, page, limit }) {
  const where = { deletedAt: null, ...(status && { status }), ...(category && { category }) };
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        originalFileName: true,
        category: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);
  return { items, total, page, limit };
}

// ----------------------------------------------------------------------
// Appointment oversight (read-only — accept/reject/complete stay with the
// participants themselves in appointment.routes.js)
// ----------------------------------------------------------------------
async function listAllAppointments({ status, page, limit }) {
  const where = { ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledStart: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        consultationCharge: true,
        user: { select: { id: true, name: true } },
        lawyerProfile: { select: { id: true, barCouncilId: true, user: { select: { name: true } } } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);
  return { items, total, page, limit };
}

// ----------------------------------------------------------------------
// Activity Timeline
// ----------------------------------------------------------------------
async function listActivityEvents({
  userId,
  entityType,
  entityId,
  action,
  search,
  from,
  to,
  page,
  limit,
}) {
  const where = {
    ...(userId && { userId }),
    ...(entityType && {
      entityType: {
        equals: entityType,
        mode: "insensitive",
      },
    }),
    ...(entityId && { entityId }),
    ...(action && {
      action: {
        equals: action,
        mode: "insensitive",
      },
    }),
  };

  if (from || to) {
    where.createdAt = {};

    if (from) {
      where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }

    if (to) {
      where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        action: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        entityType: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        entityId: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        user: {
          is: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        user: {
          is: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.activityEvent.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        entityType: true,
        entityId: true,
        action: true,
        title: true,
        description: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    }),

    prisma.activityEvent.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getActivityEventDetail(activityEventId) {
  const activityEvent = await prisma.activityEvent.findUnique({
    where: {
      id: activityEventId,
    },
    select: {
      id: true,
      userId: true,
      entityType: true,
      entityId: true,
      action: true,
      title: true,
      description: true,
      metadata: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isBanned: true,
        },
      },
    },
  });

  if (!activityEvent) {
    throw new ApiError(404, "Activity event not found");
  }

  return activityEvent;
}


module.exports = {
  getOverview,
  getRevenueOverTime,
  listUsers,
  getUserDetail,
  setBanStatus,
  forceLogout,
  listLawyers,
  listAllPayments,
  listAllDocuments,
  listAllAppointments,
  listAuditLogs,
   // Activity Timeline
  listActivityEvents,
  getActivityEventDetail,
};
