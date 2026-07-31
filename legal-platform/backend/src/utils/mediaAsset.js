const prisma = require("../config/db");

// Only called for marketing/CMS uploads (blog covers, testimonial avatars,
// SEO OG images, service covers) — deliberately NOT called for documents,
// KYC files, or chat attachments. Those already have their own
// access-controlled tables (Document, LawyerProfile, ChatMessage); mixing
// them into a plainly admin-browsable media index would leak private,
// user-owned files into a general asset browser. See MediaAsset's schema
// comment for the same note.
async function logMediaAsset({ key, originalFileName, mimeType, fileSizeBytes, usageContext, usageEntityId, uploadedByUserId }) {
  try {
    return await prisma.mediaAsset.create({
      data: { key, originalFileName, mimeType, fileSizeBytes, usageContext, usageEntityId: usageEntityId || null, uploadedByUserId: uploadedByUserId || null },
    });
  } catch (err) {
    // Never let a logging failure break the actual upload it's describing.
    console.error(`[mediaAsset] failed to log ${key}:`, err.message);
    return null;
  }
}

module.exports = { logMediaAsset };
