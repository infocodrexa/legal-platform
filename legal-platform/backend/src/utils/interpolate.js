// Replaces {{key}} tokens with data[key]. Dates are formatted the same way
// the static templates do. Unmatched tokens are left as-is (visibly ugly in
// a preview beats silently vanishing text — makes a typo'd variable name
// obvious to whoever edited the template).
function interpolate(template, data = {}) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (!(key in data) || data[key] === null || data[key] === undefined) return match;
    const value = data[key];
    if (value instanceof Date) {
      return value.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    }
    return String(value);
  });
}

module.exports = { interpolate };
