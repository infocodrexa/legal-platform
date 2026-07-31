const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { uploadPrivateObject, getSignedDownloadUrl } = require("../utils/s3");
const { encryptField, decryptField } = require("../utils/encryption");
const { writeAuditLog } = require("../utils/auditLog");
const notificationService = require("./notification.service");

// Raw S3 object keys and the encrypted Razorpay account id should never
// leave the backend — the former because private-bucket keys have no
// business in a response body, the latter because it's an internal
// payment-routing detail (encrypted at rest, but still not something the
// API should ever echo back, encrypted or not).
function omitDocKeys(profile) {
  const { licenseDocKey, panDocKey, razorpayAccountId, ...safe } = profile;
  return safe;
}

async function getProfileByUserId(userId) {
  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId },
    include: { workingHours: true },
  });
  if (!profile || profile.deletedAt) throw new ApiError(404, "Lawyer profile not found");
  return profile;
}

async function getProfileById(id) {
  const profile = await prisma.lawyerProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!profile || profile.deletedAt) throw new ApiError(404, "Lawyer profile not found");
  return profile;
}

// Sets the Razorpay Route linked-account ID a lawyer's payout share settles
// to (compliance spec Sec 2.1/2.3 — no indefinite pooling, gated on KYC).
// Stored encrypted at rest; payment.service.js decrypts it only at the
// moment of calling Razorpay's transfer API, never for display.
async function setRazorpayAccountId({ lawyerProfileId, razorpayAccountId, adminUserId }) {
  const profile = await getProfileById(lawyerProfileId);
  if (profile.kycStatus !== "VERIFIED") {
    throw new ApiError(409, "Lawyer must be KYC VERIFIED before a payout account can be linked");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.lawyerProfile.update({
      where: { id: lawyerProfileId },
      data: { razorpayAccountId: encryptField(razorpayAccountId) },
    });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "LAWYER_PAYOUT_ACCOUNT_LINKED",
      entityType: "LawyerProfile",
      entityId: lawyerProfileId,
      // Never log the plaintext account id itself — just that a change happened.
      metadata: { changed: true },
    });
    return result;
  });

  return omitDocKeys(updated);
}

// Internal-only — decrypts for the one legitimate use: actually calling
// Razorpay's transfer API. Never exported to a controller.
function decryptRazorpayAccountId(profile) {
  return profile.razorpayAccountId ? decryptField(profile.razorpayAccountId) : null;
}

// Creates the profile on first call (KYC docs required), or updates the
// editable fields on subsequent calls. Uploading a new license/PAN resets
// kycStatus to PENDING so it re-enters the review queue.
async function upsertProfile({ userId, barCouncilId, bio, specializations, experienceYears, consultationCharge, licenseFile, panFile }) {
  const existing = await prisma.lawyerProfile.findUnique({ where: { userId } });

  const dupe = await prisma.lawyerProfile.findFirst({
    where: { barCouncilId, NOT: existing ? { id: existing.id } : undefined },
  });
  if (dupe) throw new ApiError(409, "This Bar Council ID is already registered to another account");

  let licenseDocKey = existing?.licenseDocKey;
  let panDocKey = existing?.panDocKey;
  let kycStatus = existing?.kycStatus;

  if (!existing && !licenseFile) {
    throw new ApiError(400, "License document is required to create a lawyer profile");
  }

  if (licenseFile) {
    licenseDocKey = await uploadPrivateObject({
      prefix: "kyc/license",
      userId,
      originalFileName: licenseFile.originalname,
      mimeType: licenseFile.mimetype,
      buffer: licenseFile.buffer,
    });
    kycStatus = "PENDING";
  }
  if (panFile) {
    panDocKey = await uploadPrivateObject({
      prefix: "kyc/pan",
      userId,
      originalFileName: panFile.originalname,
      mimeType: panFile.mimetype,
      buffer: panFile.buffer,
    });
    kycStatus = "PENDING";
  }

  const data = {
    barCouncilId,
    bio,
    specializations,
    experienceYears,
    consultationCharge,
    licenseDocKey,
    panDocKey,
    kycStatus: kycStatus || "PENDING",
  };

  const profile = existing
    ? await prisma.lawyerProfile.update({ where: { userId }, data })
    : await prisma.lawyerProfile.create({ data: { ...data, userId } });

  if (!existing) {
    await prisma.user.update({ where: { id: userId }, data: { role: "LAWYER" } });
  }

  return omitDocKeys(profile);
}

async function getProfileWithSignedDocs(profile) {
  const [licenseUrl, panUrl] = await Promise.all([
    profile.licenseDocKey ? getSignedDownloadUrl(profile.licenseDocKey) : null,
    profile.panDocKey ? getSignedDownloadUrl(profile.panDocKey) : null,
  ]);
  return { ...omitDocKeys(profile), licenseDocUrl: licenseUrl, panDocUrl: panUrl };
}

// Admin-side KYC decision. Payout eligibility (Phase 3, Razorpay linked
// accounts) is gated on kycStatus === 'VERIFIED' per the compliance spec.
async function decideKyc({ lawyerProfileId, decision, remarks }) {
  const profile = await getProfileById(lawyerProfileId);
  if (profile.kycStatus === "VERIFIED" && decision === "VERIFIED") {
    throw new ApiError(409, "Lawyer is already KYC verified");
  }
  const updated = await prisma.lawyerProfile.update({
    where: { id: lawyerProfileId },
    data: { kycStatus: decision, kycRemarks: remarks || null, kycReviewedAt: new Date() },
    include: { user: true },
  });

  const { user, ...lawyerProfile } = updated;
  notificationService
    .notify({
      user,
      type: "KYC_STATUS_CHANGED",
      data: { status: lawyerProfile.kycStatus, remarks: lawyerProfile.kycRemarks },
      channels: ["EMAIL", "WHATSAPP"],
    })
    .catch((err) => console.error(`[lawyer] KYC notify failed for ${lawyerProfileId}:`, err.message));

  return omitDocKeys(lawyerProfile);
}

async function setWorkingHours({ lawyerProfileId, workingHours }) {
  await getProfileById(lawyerProfileId);

  return prisma.$transaction(async (tx) => {
    await tx.workingHour.deleteMany({ where: { lawyerProfileId } });
    await tx.workingHour.createMany({
      data: workingHours.map((wh) => ({ ...wh, lawyerProfileId })),
    });
    return tx.workingHour.findMany({ where: { lawyerProfileId }, take: 100 });
  });
}

// Materializes concrete AvailabilitySlot rows for [fromDate, toDate] from the
// lawyer's active WorkingHour templates. Idempotent — existing slots for a
// given start time are skipped rather than duplicated.
async function generateSlots({ lawyerProfileId, fromDate, toDate, slotDurationMinutes }) {
  await getProfileById(lawyerProfileId);

  const templates = await prisma.workingHour.findMany({ where: { lawyerProfileId, isActive: true }, take: 100 });
  if (templates.length === 0) {
    throw new ApiError(400, "Set working hours before generating slots");
  }

  const dayIndexToEnum = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  if (end < start) throw new ApiError(400, "toDate must not be before fromDate");

  const MAX_DAYS = 60;
  const dayCount = Math.floor((end - start) / 86400000) + 1;
  if (dayCount > MAX_DAYS) throw new ApiError(400, `Range too large — max ${MAX_DAYS} days at a time`);

  const slotsToCreate = [];

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayEnum = dayIndexToEnum[d.getUTCDay()];
    const todaysTemplates = templates.filter((t) => t.dayOfWeek === dayEnum);

    for (const tpl of todaysTemplates) {
      const [startH, startM] = tpl.startTime.split(":").map(Number);
      const [endH, endM] = tpl.endTime.split(":").map(Number);

      let cursor = new Date(d);
      cursor.setUTCHours(startH, startM, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setUTCHours(endH, endM, 0, 0);

      while (cursor.getTime() + slotDurationMinutes * 60000 <= dayEnd.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60000);
        slotsToCreate.push({ lawyerProfileId, startTime: slotStart, endTime: slotEnd });
        cursor = slotEnd;
      }
    }
  }

  const result = await prisma.availabilitySlot.createMany({
    data: slotsToCreate,
    skipDuplicates: true, // relies on @@unique([lawyerProfileId, startTime])
  });

  return { requested: slotsToCreate.length, created: result.count };
}

async function listAvailableSlots({ lawyerProfileId, fromDate, toDate }) {
  await getProfileById(lawyerProfileId);

  const where = { lawyerProfileId, isBooked: false };
  if (fromDate || toDate) {
    where.startTime = {};
    if (fromDate) where.startTime.gte = new Date(`${fromDate}T00:00:00.000Z`);
    if (toDate) where.startTime.lte = new Date(`${toDate}T23:59:59.999Z`);
  } else {
    where.startTime = { gte: new Date() }; // default: only future slots
  }

  return prisma.availabilitySlot.findMany({ where, orderBy: { startTime: "asc" }, take: 200 });
}


/**
 * Returns date-wise availability for the public appointment calendar.
 *
 * Status rules:
 * AVAILABLE     -> at least one unbooked slot exists
 * FULLY_BOOKED  -> slots exist, but every slot is booked
 * UNAVAILABLE   -> no generated slots exist for that date
 */
async function getAvailabilityCalendar({
  lawyerProfileId,
  fromDate,
  toDate,
}) {
  const profile = await getProfileById(lawyerProfileId);

  // Public calendar should only expose verified, active lawyers.
  if (profile.kycStatus !== "VERIFIED" || profile.deletedAt) {
    throw new ApiError(404, "Lawyer not found");
  }

  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T23:59:59.999Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new ApiError(400, "Invalid fromDate or toDate");
  }

  if (end < start) {
    throw new ApiError(
      400,
      "toDate must not be before fromDate"
    );
  }

  const MAX_DAYS = 60;

  const startOfEndDate = new Date(
    `${toDate}T00:00:00.000Z`
  );

  const dayCount =
    Math.floor(
      (startOfEndDate.getTime() - start.getTime()) /
        86400000
    ) + 1;

  if (dayCount > MAX_DAYS) {
    throw new ApiError(
      400,
      `Range too large — max ${MAX_DAYS} days at a time`
    );
  }

  /*
   * Fetch every slot, including booked slots.
   *
   * listAvailableSlots() cannot be reused here because it filters:
   * isBooked: false
   *
   * Calendar needs both booked and available slots to determine
   * whether a date is green or fully booked/red.
   */
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      lawyerProfileId,
      startTime: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      isBooked: true,
    },
    orderBy: {
      startTime: "asc",
    },
    take: 1000,
  });

  /*
   * Map:
   *
   * {
   *   "2026-07-27": {
   *      totalCount: 6,
   *      availableCount: 4,
   *      bookedCount: 2
   *   }
   * }
   */
  const slotCountsByDate = new Map();

  for (const slot of slots) {
    const dateKey = slot.startTime
      .toISOString()
      .slice(0, 10);

    const current = slotCountsByDate.get(dateKey) || {
      totalCount: 0,
      availableCount: 0,
      bookedCount: 0,
    };

    current.totalCount += 1;

    if (slot.isBooked) {
      current.bookedCount += 1;
    } else {
      current.availableCount += 1;
    }

    slotCountsByDate.set(dateKey, current);
  }

  const dates = [];

  /*
   * Return every date in the requested range.
   * Dates without generated slots are marked UNAVAILABLE.
   */
  for (
    let cursor = new Date(`${fromDate}T00:00:00.000Z`);
    cursor <= startOfEndDate;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dateKey = cursor.toISOString().slice(0, 10);

    const counts = slotCountsByDate.get(dateKey) || {
      totalCount: 0,
      availableCount: 0,
      bookedCount: 0,
    };

    let status = "UNAVAILABLE";

    if (counts.availableCount > 0) {
      status = "AVAILABLE";
    } else if (
      counts.totalCount > 0 &&
      counts.bookedCount === counts.totalCount
    ) {
      status = "FULLY_BOOKED";
    }

    dates.push({
      date: dateKey,
      status,
      availableCount: counts.availableCount,
      bookedCount: counts.bookedCount,
      totalCount: counts.totalCount,
    });
  }

  return {
    lawyerProfileId,
    fromDate,
    toDate,
    dates,
  };
}


const PUBLIC_LAWYER_SELECT = {
  id: true,
  bio: true,
  specializations: true,
  experienceYears: true,
  consultationCharge: true,
  user: { select: { name: true } },
};


// Public directory listing — only ever VERIFIED lawyers, never leaks KYC
// status, doc keys, or anything internal. This is what the frontend's
// existing lawyer directory page (previously reading mock-data.js) needs
// to actually list real lawyers; there was no endpoint for it before.
async function listPublicDirectory({ specialization, page, limit }) {
  const where = {
    deletedAt: null,
    kycStatus: "VERIFIED",
    ...(specialization && { specializations: { has: specialization } }),
  };
  const [items, total] = await Promise.all([
    prisma.lawyerProfile.findMany({
      where,
      select: PUBLIC_LAWYER_SELECT,
      orderBy: { experienceYears: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lawyerProfile.count({ where }),
  ]);

  // One grouped query for every lawyer on this page, not N+1 queries.
  const ratings = await prisma.review.groupBy({
    by: ["lawyerId"],
    where: { lawyerId: { in: items.map((i) => i.id) }, isPublished: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingByLawyerId = new Map(ratings.map((r) => [r.lawyerId, { avgRating: r._avg.rating, reviewCount: r._count.rating }]));

  const itemsWithRating = items.map((item) => ({
    ...item,
    avgRating: ratingByLawyerId.get(item.id)?.avgRating ?? null,
    reviewCount: ratingByLawyerId.get(item.id)?.reviewCount ?? 0,
  }));

  return { items: itemsWithRating, total, page, limit };
}

async function getPublicProfile(lawyerProfileId) {
  const profile = await prisma.lawyerProfile.findUnique({
    where: { id: lawyerProfileId },
    select: { ...PUBLIC_LAWYER_SELECT, kycStatus: true, deletedAt: true },
  });
  if (!profile || profile.deletedAt || profile.kycStatus !== "VERIFIED") {
    throw new ApiError(404, "Lawyer not found");
  }
  const { kycStatus, deletedAt, ...safe } = profile;

  const rating = await prisma.review.aggregate({
    where: { lawyerId: lawyerProfileId, isPublished: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return { ...safe, avgRating: rating._avg.rating, reviewCount: rating._count.rating };
}

module.exports = {
  getProfileByUserId,
  getProfileById,
  upsertProfile,
  getProfileWithSignedDocs,
  decideKyc,
  setRazorpayAccountId,
  decryptRazorpayAccountId,
  setWorkingHours,
  generateSlots,
  listAvailableSlots,
  getAvailabilityCalendar,
  listPublicDirectory,
  getPublicProfile,
};
