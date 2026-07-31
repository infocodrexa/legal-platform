const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { ApiError } = require("./apiResponse");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName =
  process.env.SUPABASE_DOCUMENT_BUCKET || "legal-documents";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
  );
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function sanitizeFileName(fileName = "file") {
  return fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Upload a private object to Supabase Storage.
 *
 * Returns only the storage path, which is stored
 * in the existing Document.fileKey database field.
 */
async function uploadPrivateObject({
  prefix = "documents",
  userId,
  originalFileName,
  mimeType,
  buffer,
}) {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  if (!buffer) {
    throw new ApiError(400, "File buffer is required");
  }

  const extension = path.extname(originalFileName || "");
  const baseName = path.basename(
    originalFileName || "document",
    extension
  );

  const safeBaseName =
    sanitizeFileName(baseName) || "document";

  const uniqueFileName = [
    Date.now(),
    crypto.randomUUID(),
    safeBaseName,
  ].join("-");

  const filePath =
    `${prefix}/${userId}/` +
    `${uniqueFileName}${extension.toLowerCase()}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType:
        mimeType || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload failed:", {
      bucket: bucketName,
      path: filePath,
      message: error.message,
    });

    throw new ApiError(
      500,
      `File upload failed: ${error.message}`
    );
  }

  return data.path;
}

/**
 * Generate a temporary signed URL.
 *
 * options.download:
 * - false: browser preview
 * - true: force download
 * - "filename.pdf": download with specific name
 */
async function getSignedDownloadUrl(
  fileKey,
  options = {}
) {
  if (!fileKey) {
    throw new ApiError(400, "File key is required");
  }

  const {
    expiresIn = 300,
    download = false,
  } = options;

  const signedUrlOptions = {};

  if (download) {
    signedUrlOptions.download =
      typeof download === "string"
        ? download
        : true;
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(
      fileKey,
      expiresIn,
      signedUrlOptions
    );

  if (error) {
    console.error(
      "Supabase signed URL generation failed:",
      {
        bucket: bucketName,
        fileKey,
        message: error.message,
      }
    );

    throw new ApiError(
      500,
      `Could not generate file URL: ${error.message}`
    );
  }

  return data.signedUrl;
}

/**
 * Permanently delete an object from Supabase Storage.
 */
async function deletePrivateObject(fileKey) {
  if (!fileKey) {
    throw new ApiError(400, "File key is required");
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([fileKey]);

  if (error) {
    console.error("Supabase deletion failed:", {
      bucket: bucketName,
      fileKey,
      message: error.message,
    });

    throw new ApiError(
      500,
      `File deletion failed: ${error.message}`
    );
  }

  return data;
}

module.exports = {
  uploadPrivateObject,
  getSignedDownloadUrl,
  deletePrivateObject,
};