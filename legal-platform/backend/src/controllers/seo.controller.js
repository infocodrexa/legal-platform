const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const seoService = require("../services/seo.service");

const upsert = asyncHandler(async (req, res) => {
  const meta = await seoService.upsertByPath({
    path: req.body.path,
    title: req.body.title,
    description: req.body.description,
    canonicalUrl: req.body.canonicalUrl,
    schemaJson: req.body.schemaJson,
    ogImageFile: req.file,
    adminUserId: req.user.id,
  });
  sendSuccess(res, { statusCode: 201, message: "SEO metadata saved.", data: meta });
});

const getByPath = asyncHandler(async (req, res) => {
  const meta = await seoService.getByPath(req.query.path);
  sendSuccess(res, { data: meta });
});

const listAllAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await seoService.listAllForAdmin({ page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const remove = asyncHandler(async (req, res) => {
  await seoService.remove(req.params.seoMetaId);
  sendSuccess(res, { message: "SEO metadata deleted." });
});

// Plain-text/XML responses, not the JSON envelope — these are consumed by
// crawlers, not the frontend app.
const sitemap = asyncHandler(async (req, res) => {
  const xml = await seoService.generateSitemapXml();
  res.type("application/xml").send(xml);
});

const robots = asyncHandler(async (req, res) => {
  res.type("text/plain").send(seoService.generateRobotsTxt());
});

module.exports = { upsert, getByPath, listAllAdmin, remove, sitemap, robots };
