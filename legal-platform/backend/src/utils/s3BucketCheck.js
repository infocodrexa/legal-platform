const env = require("../config/env");

// Compatibility name retained for the existing server boot sequence.
// Supabase buckets must be created as private in the Supabase dashboard.
async function verifyBucketIsPrivate() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_STORAGE_BUCKET) {
    console.warn("⚠️  Supabase Storage is not configured — file uploads and previews are unavailable.");
    return { checked: false };
  }

  try {
    const response = await fetch(`${env.SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(env.SUPABASE_STORAGE_BUCKET)}`, {
      headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!response.ok) throw new Error(`Storage bucket check returned ${response.status}`);
    const bucket = await response.json();
    if (bucket.public) {
      console.error("❌ Supabase Storage bucket is public. Set it to private before production deployment.");
      return { checked: true, isPrivate: false };
    }
    console.log("✅ Supabase Storage bucket privacy check passed.");
    return { checked: true, isPrivate: true };
  } catch (error) {
    console.warn("⚠️  Supabase Storage privacy check could not complete:", error.message);
    return { checked: false, error: error.message };
  }
}
module.exports = { verifyBucketIsPrivate };
