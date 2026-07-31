const prisma = require("../config/db");
const env = require("../config/env");
const { ApiError } = require("../utils/apiResponse");
const { uploadPrivateObject, getSignedDownloadUrl } = require("../utils/s3");
const { buildSitemapXml, buildRobotsTxt } = require("../utils/sitemap");
const { getOrSetCache, invalidateByPrefix } = require("../utils/cache");
const { logMediaAsset } = require("../utils/mediaAsset");

function omitOgImageKey(meta) {
  const { ogImageKey, ...safe } = meta;
  return safe;
}

async function withOgImageUrl(meta) {
  const ogImageUrl = meta.ogImageKey ? await getSignedDownloadUrl(meta.ogImageKey) : null;
  return { ...omitOgImageKey(meta), ogImageUrl };
}

async function upsertByPath({ path, title, description, canonicalUrl, schemaJson, ogImageFile, adminUserId }) {
  let ogImageKey;
  if (ogImageFile) {
    ogImageKey = await uploadPrivateObject({
      prefix: "seo-og-images",
      userId: adminUserId,
      originalFileName: ogImageFile.originalname,
      mimeType: ogImageFile.mimetype,
      buffer: ogImageFile.buffer,
      optimize: true, // marketing/CMS asset — visual fidelity only, safe to re-encode
    });
  }

  const data = {
    title,
    description,
    canonicalUrl: canonicalUrl || null,
    schemaJson: schemaJson ?? undefined,
    ...(ogImageKey && { ogImageKey }),
  };

  const meta = await prisma.seoMeta.upsert({
    where: { path },
    create: { path, ...data },
    update: data,
  });
  await invalidateByPrefix(`seo:path:${path}`);

  if (ogImageFile) {
    await logMediaAsset({
      key: ogImageKey,
      originalFileName: ogImageFile.originalname,
      mimeType: ogImageFile.mimetype,
      fileSizeBytes: ogImageFile.size,
      usageContext: "seo-og-image",
      usageEntityId: meta.id,
      uploadedByUserId: adminUserId,
    });
  }

  return withOgImageUrl(meta);
}

// TTL kept under the S3 signed-URL expiry, same reasoning as
// testimonial.service.js#listPublic — the cached ogImageUrl must never
// outlive the cache entry containing it.
async function getByPath(path) {
  return getOrSetCache(`seo:path:${path}`, 120, async () => {
    const meta = await prisma.seoMeta.findUnique({ where: { path } });
    if (!meta) throw new ApiError(404, "No SEO metadata for this path");
    return withOgImageUrl(meta);
  });
}

async function listAllForAdmin({ page, limit }) {
  const [items, total] = await Promise.all([
    prisma.seoMeta.findMany({ orderBy: { path: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.seoMeta.count(),
  ]);
  return { items: items.map(omitOgImageKey), total, page, limit };
}

async function remove(seoMetaId) {
  const existing = await prisma.seoMeta.findUnique({ where: { id: seoMetaId } });
  if (!existing) throw new ApiError(404, "SEO metadata not found");
  await prisma.seoMeta.delete({ where: { id: seoMetaId } });
  await invalidateByPrefix(`seo:path:${existing.path}`);
}

// Static routes every instance of this platform has, plus every PUBLISHED
// blog post. A frontend deploying new static routes should extend this
// list — there's no way for the backend to know about client-only routes.
const STATIC_ROUTES = [
  { loc: "/", changefreq: "daily", priority: 1.0 },
  { loc: "/services", changefreq: "monthly", priority: 0.8 },
  { loc: "/how-it-works", changefreq: "monthly", priority: 0.6 },
  { loc: "/pricing", changefreq: "monthly", priority: 0.6 },
  { loc: "/faq", changefreq: "monthly", priority: 0.5 },
  { loc: "/contact", changefreq: "yearly", priority: 0.4 },
  { loc: "/blog", changefreq: "daily", priority: 0.7 },
];

async function generateSitemapXml() {
  const blogs = await prisma.blog.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000, // Google's single-sitemap limit is 50k URLs; split into a
    // sitemap index well before this if the blog ever grows that large.
  });

  const base = env.SITE_URL.replace(/\/$/, "");
  const urls = [
    ...STATIC_ROUTES.map((r) => ({ ...r, loc: `${base}${r.loc}` })),
    ...blogs.map((b) => ({
      loc: `${base}/blog/${b.slug}`,
      lastmod: b.updatedAt.toISOString().slice(0, 10),
      changefreq: "weekly",
      priority: 0.6,
    })),
  ];

  return buildSitemapXml(urls);
}

function generateRobotsTxt() {
  return buildRobotsTxt({ siteUrl: env.SITE_URL, disallowPaths: ["/api/", "/admin"] });
}

module.exports = {
  upsertByPath,
  getByPath,
  listAllForAdmin,
  remove,
  generateSitemapXml,
  generateRobotsTxt,
};
