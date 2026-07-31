const zlib = require("zlib");
const { promisify } = require("util");
const prisma = require("../config/db");
const { uploadPrivateObject, getSignedDownloadUrl } = require("./s3");

const gzip = promisify(zlib.gzip);

// Explicit allowlist, not a dynamic Prisma-model walk — deliberate, so
// adding a new model to the schema never silently starts (or stops) being
// backed up without someone updating this list on purpose. Excludes
// RefreshToken and OtpVerification on purpose: those are short-lived
// security artifacts, not data you actually want to resurrect on restore
// (a restore should force everyone to log in fresh, not bring back
// old/possibly-compromised refresh tokens).
const BACKED_UP_MODELS = [
  "user", "lawyerProfile", "workingHour", "availabilitySlot", "document",
  "documentStatusHistory", "appointment", "payment", "refund", "auditLog",
  "notification", "chatMessage", "review", "supportTicket", "supportTicketReply",
  "blog", "faq", "testimonial", "seoMeta", "messageTemplate", "service",
  "lead", "mediaAsset",
];

// Runs every model export inside one transaction so the backup is a
// consistent point-in-time snapshot rather than a set of independently-read
// tables that could drift relative to each other mid-export.
async function exportAllTables() {
  return prisma.$transaction(async (tx) => {
    const dump = { exportedAt: new Date().toISOString(), tables: {} };
    for (const model of BACKED_UP_MODELS) {
      dump.tables[model] = await tx[model].findMany();
    }
    return dump;
  });
}

async function performBackup({ triggeredByUserId }) {
  const record = await prisma.backupRecord.create({ data: { triggeredByUserId, status: "IN_PROGRESS" } });

  try {
    const dump = await exportAllTables();
    const json = JSON.stringify(dump);
    const compressed = await gzip(Buffer.from(json, "utf8"));

    const storageKey = await uploadPrivateObject({
      prefix: "backups",
      userId: triggeredByUserId || "system",
      originalFileName: `backup-${record.id}.json.gz`,
      mimeType: "application/gzip",
      buffer: compressed,
      // Never optimize — this isn't an image, and altering a single byte
      // of a backup archive defeats the entire point of it.
    });

    return prisma.backupRecord.update({
      where: { id: record.id },
      data: { status: "COMPLETED", storageKey, fileSizeBytes: compressed.length, completedAt: new Date() },
    });
  } catch (err) {
    console.error(`[backup] backup ${record.id} failed:`, err.message);
    return prisma.backupRecord.update({
      where: { id: record.id },
      data: { status: "FAILED", errorMessage: err.message, completedAt: new Date() },
    });
  }
}

async function getBackupDownloadUrl(backupRecordId) {
  const record = await prisma.backupRecord.findUnique({ where: { id: backupRecordId } });
  if (!record || record.status !== "COMPLETED" || !record.storageKey) return null;
  // Short expiry — this file contains password hashes and every row in the
  // database. Treat the signed URL itself as sensitive.
  return getSignedDownloadUrl(record.storageKey, 120);
}

module.exports = { performBackup, getBackupDownloadUrl, BACKED_UP_MODELS };
