const { z } = require("zod");

const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1),
    tags: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((v) => (typeof v === "string" ? v.split(",").map((t) => t.trim()).filter(Boolean) : v)),
  }),
});

const updateBlogSchema = z.object({
  params: z.object({ blogId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1).optional(),
    tags: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((v) => (typeof v === "string" ? v.split(",").map((t) => t.trim()).filter(Boolean) : v)),
  }),
});

const blogIdParamSchema = z.object({
  params: z.object({ blogId: z.string().uuid() }),
});

const slugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

const publishBlogSchema = z.object({
  params: z.object({ blogId: z.string().uuid() }),
  body: z.object({ status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) }),
});

const listPublishedBlogsSchema = z.object({
  query: z.object({
    tag: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

const listAllBlogsSchema = z.object({
  query: z.object({
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

module.exports = {
  createBlogSchema,
  updateBlogSchema,
  blogIdParamSchema,
  slugParamSchema,
  publishBlogSchema,
  listPublishedBlogsSchema,
  listAllBlogsSchema,
};
