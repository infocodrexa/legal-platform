const sanitizeHtml = require("sanitize-html");

// Applied to any free-text field a user controls that another user's
// browser will eventually render (chat messages, reviews, testimonials,
// support tickets, blog/FAQ content typed by admins). Defense in depth —
// the frontend should also escape/sanitize on render, but stored XSS
// should never be possible even if a render path forgets to.

// Plain text fields (chat, reviews, ticket subjects) — no HTML at all.
// A message containing "<script>" should store as inert text, not markup.
function sanitizePlainText(input) {
  if (input === null || input === undefined) return input;
  return sanitizeHtml(String(input), { allowedTags: [], allowedAttributes: {} });
}

// Rich content fields (blog body) — a small safe subset of formatting
// tags survives, everything script/event/iframe-capable is stripped.
function sanitizeRichText(input) {
  if (input === null || input === undefined) return input;
  return sanitizeHtml(String(input), {
    allowedTags: [
      "p", "br", "b", "i", "em", "strong", "u", "s", "a",
      "ul", "ol", "li", "blockquote", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    // Blocks javascript:/data: URIs in href/src — only these schemes pass.
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
    },
  });
}

module.exports = { sanitizePlainText, sanitizeRichText };
