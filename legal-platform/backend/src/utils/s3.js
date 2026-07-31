const { randomUUID } = require("crypto");
const path = require("path");
const env = require("../config/env");
const { ApiError } = require("./apiResponse");
const { optimizeImage, isOptimizable } = require("./imageOptimize");

function assertStorageConfigured() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_STORAGE_BUCKET) {
    throw new ApiError(503, "File storage is temporarily unavailable. Please contact support.");
  }
}
function buildObjectKey({ prefix, userId, originalFileName }) {
  const ext = path.extname(originalFileName || "").slice(0, 10);
  return `${prefix}/${userId}/${randomUUID()}${ext}`;
}
function storageUrl(key, action) {
  const bucket = encodeURIComponent(env.SUPABASE_STORAGE_BUCKET);
  const encodedPath = key.split("/").map(encodeURIComponent).join("/");
  return `${env.SUPABASE_URL}/storage/v1/object/${action}/${bucket}/${encodedPath}`;
}
async function storageRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[supabase-storage]", response.status, detail);
    throw new ApiError(502, "We could not process the file right now. Please try again.");
  }
  return response;
}
async function uploadPrivateObject({ prefix, userId, originalFileName, mimeType, buffer, optimize = false }) {
  assertStorageConfigured();
  const key = buildObjectKey({ prefix, userId, originalFileName });
  let finalBuffer = buffer;
  let finalMimeType = mimeType;
  if (optimize && isOptimizable(mimeType)) {
    const result = await optimizeImage(buffer, mimeType);
    finalBuffer = result.buffer;
    finalMimeType = result.mimeType;
  }
  await storageRequest(storageUrl(key, ""), {
    method: "POST",
    headers: { "Content-Type": finalMimeType || "application/octet-stream", "x-upsert": "false" },
    body: finalBuffer,
  });
  return key;
}
async function getSignedDownloadUrl(key, expiresIn = env.S3_SIGNED_URL_EXPIRY_SECONDS) {
  assertStorageConfigured();
  const response = await storageRequest(storageUrl(key, "sign"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn }),
  });
  const data = await response.json();
  const signed = data.signedURL || data.signedUrl;
  if (!signed) throw new ApiError(502, "The file preview could not be prepared. Please try again.");
  return signed.startsWith("http") ? signed : `${env.SUPABASE_URL}/storage/v1${signed}`;
}
async function deleteObject(key) {
  assertStorageConfigured();
  await storageRequest(`${env.SUPABASE_URL}/storage/v1/object/${encodeURIComponent(env.SUPABASE_STORAGE_BUCKET)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [key] }),
  });
}
module.exports = { uploadPrivateObject, getSignedDownloadUrl, deleteObject, buildObjectKey };
