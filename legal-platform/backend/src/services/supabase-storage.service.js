import crypto from "crypto";
import path from "path";

import { supabaseAdmin } from "../config/supabase.js";

function sanitizeFileName(fileName = "file") {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function uploadFileToSupabase({
  bucket,
  file,
  folder,
}) {
  if (!bucket) {
    throw new Error("Storage bucket is required");
  }

  if (!file?.buffer) {
    throw new Error("File buffer is missing");
  }

  const extension =
    path.extname(file.originalname || "") || "";

  const safeName = sanitizeFileName(
    path.basename(
      file.originalname || "file",
      extension
    )
  );

  const uniqueName =
    `${Date.now()}-${crypto.randomUUID()}` +
    `-${safeName}${extension.toLowerCase()}`;

  const objectPath = folder
    ? `${folder}/${uniqueName}`
    : uniqueName;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(objectPath, file.buffer, {
      contentType:
        file.mimetype || "application/octet-stream",
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(
      `Supabase upload failed: ${error.message}`
    );
  }

  return {
    bucket,
    path: data.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

export async function createSignedFileUrl({
  bucket,
  objectPath,
  expiresIn = 300,
}) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);

  if (error) {
    throw new Error(
      `Signed URL generation failed: ${error.message}`
    );
  }

  return data.signedUrl;
}

export async function deleteFileFromSupabase({
  bucket,
  objectPath,
}) {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([objectPath]);

  if (error) {
    throw new Error(
      `Supabase delete failed: ${error.message}`
    );
  }
}