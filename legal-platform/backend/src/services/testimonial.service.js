const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { uploadPrivateObject, getSignedDownloadUrl } = require("../utils/s3");
const { sanitizePlainText } = require("../utils/sanitize");
const { getOrSetCache, invalidateByPrefix } = require("../utils/cache");
const { logMediaAsset } = require("../utils/mediaAsset");

function omitAvatarKey(testimonial) {
  const { avatarKey, ...safe } = testimonial;
  return safe;
}

async function withAvatarUrl(testimonial) {
  const avatarUrl = testimonial.avatarKey ? await getSignedDownloadUrl(testimonial.avatarKey) : null;
  return { ...omitAvatarKey(testimonial), avatarUrl };
}

function sanitizeTestimonialFields(data) {
  const clean = { ...data };
  if (clean.authorName !== undefined) clean.authorName = sanitizePlainText(clean.authorName);
  if (clean.authorRole !== undefined) clean.authorRole = sanitizePlainText(clean.authorRole);
  if (clean.quote !== undefined) clean.quote = sanitizePlainText(clean.quote);
  return clean;
}

async function create({ data, avatarFile, adminUserId }) {
  let avatarKey = null;
  if (avatarFile) {
    avatarKey = await uploadPrivateObject({
      prefix: "testimonial-avatars",
      userId: adminUserId,
      originalFileName: avatarFile.originalname,
      mimeType: avatarFile.mimetype,
      buffer: avatarFile.buffer,
      optimize: true, // marketing/CMS asset — visual fidelity only, safe to re-encode
    });
  }
  const testimonial = await prisma.testimonial.create({ data: { ...sanitizeTestimonialFields(data), avatarKey } });
  await invalidateByPrefix("testimonials:");

  if (avatarKey) {
    await logMediaAsset({
      key: avatarKey,
      originalFileName: avatarFile.originalname,
      mimeType: avatarFile.mimetype,
      fileSizeBytes: avatarFile.size,
      usageContext: "testimonial-avatar",
      usageEntityId: testimonial.id,
      uploadedByUserId: adminUserId,
    });
  }

  return withAvatarUrl(testimonial);
}

async function update({ testimonialId, data, avatarFile, adminUserId }) {
  const existing = await prisma.testimonial.findUnique({ where: { id: testimonialId } });
  if (!existing) throw new ApiError(404, "Testimonial not found");

  let avatarKey = existing.avatarKey;
  if (avatarFile) {
    avatarKey = await uploadPrivateObject({
      prefix: "testimonial-avatars",
      userId: adminUserId,
      originalFileName: avatarFile.originalname,
      mimeType: avatarFile.mimetype,
      buffer: avatarFile.buffer,
      optimize: true, // marketing/CMS asset — visual fidelity only, safe to re-encode
    });
  }
  const testimonial = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: { ...sanitizeTestimonialFields(data), avatarKey },
  });
  await invalidateByPrefix("testimonials:");

  if (avatarFile) {
    await logMediaAsset({
      key: avatarKey,
      originalFileName: avatarFile.originalname,
      mimeType: avatarFile.mimetype,
      fileSizeBytes: avatarFile.size,
      usageContext: "testimonial-avatar",
      usageEntityId: testimonial.id,
      uploadedByUserId: adminUserId,
    });
  }

  return withAvatarUrl(testimonial);
}

async function remove(testimonialId) {
  const existing = await prisma.testimonial.findUnique({ where: { id: testimonialId } });
  if (!existing) throw new ApiError(404, "Testimonial not found");
  await prisma.testimonial.delete({ where: { id: testimonialId } });
  await invalidateByPrefix("testimonials:");
}

// Cache TTL (120s) is kept comfortably under the S3 signed-URL expiry
// (S3_SIGNED_URL_EXPIRY_SECONDS, default 300s) so a cached response's
// avatarUrl never goes stale before the cache entry itself expires.
async function listPublic() {
  return getOrSetCache("testimonials:public", 120, async () => {
    const items = await prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 100, // bounded — curated content, not a paginated feed
    });
    return Promise.all(items.map(withAvatarUrl));
  });
}

async function listAllForAdmin({ isPublished, page, limit }) {
  const where = { ...(isPublished !== undefined && { isPublished }) };
  const [items, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
  ]);
  return { items: items.map(omitAvatarKey), total, page, limit };
}

module.exports = { create, update, remove, listPublic, listAllForAdmin };
