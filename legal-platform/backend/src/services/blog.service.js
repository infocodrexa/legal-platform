const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { uploadPrivateObject, getSignedDownloadUrl } = require("../utils/s3");
const { slugify } = require("../utils/slugify");
const { sanitizePlainText, sanitizeRichText } = require("../utils/sanitize");
const { logMediaAsset } = require("../utils/mediaAsset");

function omitCoverKey(blog) {
  const { coverImageKey, ...safe } = blog;
  return safe;
}

async function withCoverUrl(blog) {
  const coverImageUrl = blog.coverImageKey ? await getSignedDownloadUrl(blog.coverImageKey) : null;
  return { ...omitCoverKey(blog), coverImageUrl };
}

function sanitizeBlogFields(data) {
  const clean = { ...data };
  if (clean.title !== undefined) clean.title = sanitizePlainText(clean.title);
  if (clean.excerpt !== undefined) clean.excerpt = sanitizePlainText(clean.excerpt);
  // Content is markdown that may pass through raw HTML depending on the
  // frontend's renderer — sanitize as rich text (safe tag allowlist) as
  // defense in depth against an admin pasting a script tag.
  if (clean.content !== undefined) clean.content = sanitizeRichText(clean.content);
  return clean;
}

// Appends -2, -3, ... until a free slug is found. Small collision window
// (read-then-write) is acceptable here — blog creation isn't high enough
// throughput to need a DB-level retry loop, and the @unique constraint on
// `slug` is the actual backstop against a genuine race.
async function generateUniqueSlug(title) {
  const base = slugify(title) || "post";
  let candidate = base;
  let suffix = 2;
  while (await prisma.blog.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function createBlog({ authorId, title, excerpt, content, tags, coverImageFile }) {
  const slug = await generateUniqueSlug(title);

  let coverImageKey = null;
  if (coverImageFile) {
    coverImageKey = await uploadPrivateObject({
      prefix: "blog-covers",
      userId: authorId,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      buffer: coverImageFile.buffer,
      optimize: true, // marketing/CMS asset — visual fidelity only, safe to re-encode
    });
  }

  const blog = await prisma.blog.create({
    data: {
      ...sanitizeBlogFields({ title, excerpt: excerpt || null, content }),
      slug,
      tags: tags || [],
      coverImageKey,
      authorId,
    },
  });

  if (coverImageKey) {
    await logMediaAsset({
      key: coverImageKey,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      fileSizeBytes: coverImageFile.size,
      usageContext: "blog-cover",
      usageEntityId: blog.id,
      uploadedByUserId: authorId,
    });
  }

  return withCoverUrl(blog);
}

async function updateBlog({ blogId, data, coverImageFile }) {
  const existing = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!existing || existing.deletedAt) throw new ApiError(404, "Blog post not found");

  let coverImageKey = existing.coverImageKey;
  if (coverImageFile) {
    coverImageKey = await uploadPrivateObject({
      prefix: "blog-covers",
      userId: existing.authorId,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      buffer: coverImageFile.buffer,
      optimize: true, // marketing/CMS asset — visual fidelity only, safe to re-encode
    });
  }

  const blog = await prisma.blog.update({
    where: { id: blogId },
    data: { ...sanitizeBlogFields(data), coverImageKey },
  });

  if (coverImageFile) {
    await logMediaAsset({
      key: coverImageKey,
      originalFileName: coverImageFile.originalname,
      mimeType: coverImageFile.mimetype,
      fileSizeBytes: coverImageFile.size,
      usageContext: "blog-cover",
      usageEntityId: blog.id,
      uploadedByUserId: existing.authorId,
    });
  }

  return withCoverUrl(blog);
}

async function publishBlog({ blogId, status }) {
  const existing = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!existing || existing.deletedAt) throw new ApiError(404, "Blog post not found");

  const blog = await prisma.blog.update({
    where: { id: blogId },
    data: {
      status,
      // Only stamp publishedAt the first time it goes live — re-publishing
      // after an ARCHIVED detour shouldn't reset the original publish date.
      publishedAt: status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });
  return withCoverUrl(blog);
}

async function getPublishedBySlug(slug) {
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true } }, seoMeta: true },
  });
  if (!blog || blog.deletedAt || blog.status !== "PUBLISHED") throw new ApiError(404, "Blog post not found");
  return withCoverUrl(blog);
}

async function getByIdForAdmin(blogId) {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: { author: { select: { id: true, name: true } }, seoMeta: true },
  });
  if (!blog || blog.deletedAt) throw new ApiError(404, "Blog post not found");
  return withCoverUrl(blog);
}

async function listPublished({ tag, page, limit }) {
  const where = { deletedAt: null, status: "PUBLISHED", ...(tag && { tags: { has: tag } }) };
  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.blog.count({ where }),
  ]);
  return { items: await Promise.all(items.map(withCoverUrl)), total, page, limit };
}

async function listAllForAdmin({ status, page, limit }) {
  const where = { deletedAt: null, ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.blog.count({ where }),
  ]);
  return { items: items.map(omitCoverKey), total, page, limit };
}

async function deleteBlog(blogId) {
  const existing = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!existing || existing.deletedAt) throw new ApiError(404, "Blog post not found");
  await prisma.blog.update({ where: { id: blogId }, data: { deletedAt: new Date() } });
}

module.exports = {
  createBlog,
  updateBlog,
  publishBlog,
  getPublishedBySlug,
  getByIdForAdmin,
  listPublished,
  listAllForAdmin,
  deleteBlog,
};
