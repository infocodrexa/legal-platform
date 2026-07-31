const sharp = require("sharp");

const OPTIMIZABLE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 1920; // px, longest side
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 82;

function isOptimizable(mimeType) {
  return OPTIMIZABLE_MIME_TYPES.has(mimeType);
}

// Re-encodes to strip EXIF/metadata (which can leak GPS location, device
// info, etc. from user-uploaded photos), caps the longest side at
// MAX_DIMENSION without upscaling smaller images, and re-compresses.
// PDFs and any non-raster type pass through untouched — this only ever
// touches the three raster types above.
async function optimizeImage(buffer, mimeType) {
  if (!isOptimizable(mimeType)) return { buffer, mimeType };

  const pipeline = sharp(buffer)
    .rotate() // apply EXIF orientation before stripping it
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });

  if (mimeType === "image/png") {
    // Keep PNG for images that need transparency; still re-compresses.
    const optimized = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    return { buffer: optimized, mimeType: "image/png" };
  }

  if (mimeType === "image/webp") {
    const optimized = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
    return { buffer: optimized, mimeType: "image/webp" };
  }

  // image/jpeg (and anything else optimizable, currently just jpeg)
  const optimized = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  return { buffer: optimized, mimeType: "image/jpeg" };
}

module.exports = { optimizeImage, isOptimizable, MAX_DIMENSION };
