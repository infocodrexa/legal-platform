const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { sanitizePlainText } = require("../utils/sanitize");
const { getOrSetCache, invalidateByPrefix } = require("../utils/cache");

function sanitizeFaqFields(data) {
  const clean = { ...data };
  if (clean.question !== undefined) clean.question = sanitizePlainText(clean.question);
  if (clean.answer !== undefined) clean.answer = sanitizePlainText(clean.answer);
  return clean;
}

async function create(data) {
  const faq = await prisma.faq.create({ data: sanitizeFaqFields(data) });
  await invalidateByPrefix("faq:");
  return faq;
}

async function update(faqId, data) {
  const existing = await prisma.faq.findUnique({ where: { id: faqId } });
  if (!existing) throw new ApiError(404, "FAQ not found");
  const updated = await prisma.faq.update({ where: { id: faqId }, data: sanitizeFaqFields(data) });
  await invalidateByPrefix("faq:");
  return updated;
}

async function remove(faqId) {
  const existing = await prisma.faq.findUnique({ where: { id: faqId } });
  if (!existing) throw new ApiError(404, "FAQ not found");
  await prisma.faq.delete({ where: { id: faqId } });
  await invalidateByPrefix("faq:");
}

async function listPublic({ category }) {
  return getOrSetCache(`faq:public:${category || "all"}`, 300, () =>
    prisma.faq.findMany({
      where: { isPublished: true, ...(category && { category }) },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      take: 200, // bounded — this is a curated content list, not a paginated feed
    })
  );
}

async function listAllForAdmin({ category, isPublished, page, limit }) {
  const where = { ...(category && { category }), ...(isPublished !== undefined && { isPublished }) };
  const [items, total] = await Promise.all([
    prisma.faq.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.faq.count({ where }),
  ]);
  return { items, total, page, limit };
}

module.exports = { create, update, remove, listPublic, listAllForAdmin };
