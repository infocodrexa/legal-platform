// Converts "Understanding Property Disputes in India!" ->
// "understanding-property-disputes-in-india". Pure string logic, no I/O —
// uniqueness (appending -2, -3, ...) is handled by the caller since that
// needs a DB lookup.
function slugify(input) {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { slugify };
