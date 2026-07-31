const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Every authenticated dashboard prefix — /lawyer was missing here,
      // which would have left the entire Lawyer Dashboard crawlable and
      // indexable despite being behind auth.
      disallow: ["/dashboard", "/lawyer", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
