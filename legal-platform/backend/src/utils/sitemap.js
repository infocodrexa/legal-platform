// Minimal XML escaping — URLs and dates going through here are either
// system-generated (slugs, ISO dates) or already validated, but escape
// anyway since a stray & in a slug would otherwise produce invalid XML.
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// urls: [{ loc, lastmod?, changefreq?, priority? }]
function buildSitemapXml(urls) {
  const entries = urls
    .map((u) => {
      const parts = [`    <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${escapeXml(u.changefreq)}</changefreq>`);
      if (u.priority !== undefined) parts.push(`    <priority>${u.priority}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function buildRobotsTxt({ siteUrl, disallowPaths = [] }) {
  const lines = ["User-agent: *"];
  for (const path of disallowPaths) lines.push(`Disallow: ${path}`);
  if (disallowPaths.length === 0) lines.push("Disallow:");
  lines.push("", `Sitemap: ${siteUrl.replace(/\/$/, "")}/sitemap.xml`);
  return lines.join("\n") + "\n";
}

module.exports = { buildSitemapXml, buildRobotsTxt, escapeXml };
