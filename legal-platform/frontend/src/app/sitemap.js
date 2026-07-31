import { serviceApi, blogApi, lawyerApi } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function safeList(promise) {
  try {
    const { data } = await promise;
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/how-it-works",
    "/pricing",
    "/lawyers",
    "/blog",
    "/faq",
    "/contact",
    "/legal/terms",
    "/legal/privacy",
    "/legal/refunds",
    "/legal/disclaimer",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/blog" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));

  const [services, posts, lawyers] = await Promise.all([
    safeList(serviceApi.listPublished({ page: 1, limit: 100 })),
    safeList(blogApi.listPublished({ page: 1, limit: 200 })),
    safeList(lawyerApi.listPublicDirectory({ page: 1, limit: 200 })),
  ]);

  const serviceRoutes = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt || p.updatedAt),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  const lawyerRoutes = lawyers.map((l) => ({
    url: `${SITE_URL}/lawyers/${l.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes, ...lawyerRoutes];
}
