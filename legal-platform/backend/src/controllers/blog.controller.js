const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const blogService = require("../services/blog.service");

const create = asyncHandler(async (req, res) => {
  const blog = await blogService.createBlog({
    authorId: req.user.id,
    title: req.body.title,
    excerpt: req.body.excerpt,
    content: req.body.content,
    tags: req.body.tags,
    coverImageFile: req.file,
  });
  sendSuccess(res, { statusCode: 201, message: "Blog post created as draft.", data: blog });
});

const update = asyncHandler(async (req, res) => {
  const blog = await blogService.updateBlog({
    blogId: req.params.blogId,
    data: req.body,
    coverImageFile: req.file,
  });
  sendSuccess(res, { message: "Blog post updated.", data: blog });
});

const publish = asyncHandler(async (req, res) => {
  const blog = await blogService.publishBlog({ blogId: req.params.blogId, status: req.body.status });
  sendSuccess(res, { message: `Blog post status set to ${blog.status}.`, data: blog });
});

const getBySlug = asyncHandler(async (req, res) => {
  const blog = await blogService.getPublishedBySlug(req.params.slug);
  sendSuccess(res, { data: blog });
});

const getByIdAdmin = asyncHandler(async (req, res) => {
  const blog = await blogService.getByIdForAdmin(req.params.blogId);
  sendSuccess(res, { data: blog });
});

const listPublished = asyncHandler(async (req, res) => {
  const { tag, page, limit } = req.query;
  const result = await blogService.listPublished({ tag, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const listAllAdmin = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await blogService.listAllForAdmin({ status, page, limit });
  sendSuccess(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});

const remove = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.blogId);
  sendSuccess(res, { message: "Blog post deleted." });
});

module.exports = { create, update, publish, getBySlug, getByIdAdmin, listPublished, listAllAdmin, remove };
