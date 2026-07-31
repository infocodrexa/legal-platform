const crypto = require("crypto");
const env = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey() {
  if (!env.FIELD_ENCRYPTION_KEY) {
    throw new Error("FIELD_ENCRYPTION_KEY is not set — cannot encrypt/decrypt sensitive fields.");
  }
  const key = Buffer.from(env.FIELD_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a 32-byte value encoded as 64 hex characters.");
  }
  return key;
}

// Output format: "<iv>:<authTag>:<ciphertext>", each hex-encoded. Storing
// the IV and auth tag alongside the ciphertext (rather than in a separate
// column) keeps callers from needing to know anything about the scheme —
// encryptField/decryptField are a matched pair, nothing else touches the
// format.
function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptField(ciphertext) {
  if (ciphertext === null || ciphertext === undefined) return null;
  const key = getKey();
  const parts = String(ciphertext).split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted field value.");
  }
  const [ivHex, authTagHex, dataHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

module.exports = { encryptField, decryptField };
