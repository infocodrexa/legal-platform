const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { getSignedDownloadUrl } = require("../utils/s3");

function omitKey(asset) {
  const { key, ...safe } = asset;
  return safe;
}

async function withUrl(asset) {
  const url = await getSignedDownloadUrl(asset.key);
  return { ...omitKey(asset), url };
}

async function list({ usageContext, page, limit }) {
  const where = { deletedAt: null, ...(usageContext && { usageContext }) };
  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { uploadedByUser: { select: { id: true, name: true } } },
    }),
    prisma.mediaAsset.count({ where }),
  ]);
  return { items: await Promise.all(items.map(withUrl)), total, page, limit };
}

async function getById(mediaAssetId) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    include: { uploadedByUser: { select: { id: true, name: true } } },
  });
  if (!asset || asset.deletedAt) throw new ApiError(404, "Media asset not found");
  return withUrl(asset);
}

// Soft-delete only — removes it from the library listing without touching
// the actual S3 object or the owning record's key field (a Blog/
// Testimonial/Service might still be actively pointing at this exact key).
// Actually deleting the underlying file is a separate, more dangerous
// operation intentionally not exposed here.
async function remove(mediaAssetId) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
  if (!asset || asset.deletedAt) throw new ApiError(404, "Media asset not found");
  await prisma.mediaAsset.update({ where: { id: mediaAssetId }, data: { deletedAt: new Date() } });
}

async function usageContexts() {
  const rows = await prisma.mediaAsset.findMany({
    where: { deletedAt: null },
    select: { usageContext: true },
    distinct: ["usageContext"],
  });
  return rows.map((r) => r.usageContext);
}

module.exports = { list, getById, remove, usageContexts };
