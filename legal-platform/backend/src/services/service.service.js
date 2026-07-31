const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { uploadPrivateObject, getSignedDownloadUrl } = require("../utils/s3");
const { slugify } = require("../utils/slugify");
const { sanitizePlainText, sanitizeRichText } = require("../utils/sanitize");
const { logMediaAsset } = require("../utils/mediaAsset");
const { getOrSetCache, invalidateByPrefix } = require("../utils/cache");

function omitCoverKey(service) {
  const { coverImageKey, ...safe } = service;
  return safe;
}

async function withCoverUrl(service) {
  const coverImageUrl = service.coverImageKey ? await getSignedDownloadUrl(service.coverImageKey) : null;
  return { ...omitCoverKey(service), coverImageUrl };
}

function sanitizeServiceFields(data) {
  const clean = { ...data };
  if (clean.name !== undefined) clean.name = sanitizePlainText(clean.name);
  if (clean.description !== undefined) clean.description = sanitizePlainText(clean.description);
  if (clean.longDescription !== undefined) clean.longDescription = sanitizeRichText(clean.longDescription);
  if (clean.covers !== undefined) clean.covers = clean.covers.map(sanitizePlainText);
  return clean;
}

async function generateUniqueSlug(name) {
  const base = slugify(name) || "service";
  let candidate = base;
  let suffix = 2;
  while (await prisma.service.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function create({ data, coverImageFile, adminUserId }) {
  const slug = await generateUniqueSlug(data.name);

  let coverImageKey = null;
  if (coverImageFile) {
    coverImageKey = await uploadPrivateObject({
      prefix: "service-covers",
      userId: adminUserId,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      buffer: coverImageFile.buffer,
      optimize: true,
    });
  }

  const service = await prisma.service.create({
    data: { ...sanitizeServiceFields(data), slug, coverImageKey },
  });
  await invalidateByPrefix("services:");

  if (coverImageKey) {
    await logMediaAsset({
      key: coverImageKey,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      fileSizeBytes: coverImageFile.size,
      usageContext: "service-cover",
      usageEntityId: service.id,
      uploadedByUserId: adminUserId,
    });
  }

  return withCoverUrl(service);
}

async function update({ serviceId, data, coverImageFile, adminUserId }) {
  const existing = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!existing || existing.deletedAt) throw new ApiError(404, "Service not found");

  let coverImageKey = existing.coverImageKey;
  if (coverImageFile) {
    coverImageKey = await uploadPrivateObject({
      prefix: "service-covers",
      userId: adminUserId,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      buffer: coverImageFile.buffer,
      optimize: true,
    });
  }

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { ...sanitizeServiceFields(data), coverImageKey },
  });
  await invalidateByPrefix("services:");

  if (coverImageFile) {
    await logMediaAsset({
      key: coverImageKey,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      fileSizeBytes: coverImageFile.size,
      usageContext: "service-cover",
      usageEntityId: service.id,
      uploadedByUserId: adminUserId,
    });
  }

  return withCoverUrl(service);
}

async function remove(serviceId) {
  const existing = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!existing || existing.deletedAt) throw new ApiError(404, "Service not found");
  await prisma.service.update({ where: { id: serviceId }, data: { deletedAt: new Date() } });
  await invalidateByPrefix("services:");
}

async function getPublishedBySlug(slug) {
  return getOrSetCache(`services:slug:${slug}`, 300, async () => {
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service || service.deletedAt || !service.isPublished) throw new ApiError(404, "Service not found");
    return withCoverUrl(service);
  });
}

async function getByIdForAdmin(serviceId) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.deletedAt) throw new ApiError(404, "Service not found");
  return withCoverUrl(service);
}

// TTL kept under the S3 signed-URL expiry, same reasoning as
// testimonial.service.js#listPublic.
async function listPublished({ page, limit }) {
  return getOrSetCache(`services:public:${page}:${limit}`, 120, async () => {
    const where = { deletedAt: null, isPublished: true };
    const [items, total] = await Promise.all([
      prisma.service.findMany({ where, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }], skip: (page - 1) * limit, take: limit }),
      prisma.service.count({ where }),
    ]);
    return { items: await Promise.all(items.map(withCoverUrl)), total, page, limit };
  });
}

async function listAllForAdmin({ isPublished, page, limit }) {
  const where = { deletedAt: null, ...(isPublished !== undefined && { isPublished }) };
  const [items, total] = await Promise.all([
    prisma.service.findMany({ where, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }], skip: (page - 1) * limit, take: limit }),
    prisma.service.count({ where }),
  ]);
  return { items: items.map(omitCoverKey), total, page, limit };
}

module.exports = { create, update, remove, getPublishedBySlug, getByIdForAdmin, listPublished, listAllForAdmin };
