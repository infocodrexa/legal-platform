const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { performBackup, getBackupDownloadUrl } = require("../utils/backup");
const { writeAuditLog } = require("../utils/auditLog");

// Raw S3 key should never leave the backend — same convention as every
// other stored-file model in this codebase. Downloads go through
// getDownloadUrl(), which returns a short-lived signed URL instead.
function omitStorageKey(record) {
  const { storageKey, ...safe } = record;
  return safe;
}

async function trigger({ adminUserId }) {
  // Runs synchronously in-request for now — fine at current data volumes.
  // If this ever gets slow enough to matter, move it to a background job
  // queue and have this just enqueue + return the IN_PROGRESS record.
  const record = await performBackup({ triggeredByUserId: adminUserId });

  await prisma.$transaction(async (tx) => {
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: record.status === "COMPLETED" ? "BACKUP_COMPLETED" : "BACKUP_FAILED",
      entityType: "BackupRecord",
      entityId: record.id,
      metadata: { fileSizeBytes: record.fileSizeBytes, errorMessage: record.errorMessage },
    });
  });

  return omitStorageKey(record);
}

async function list({ page, limit }) {
  const [items, total] = await Promise.all([
    prisma.backupRecord.findMany({
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { triggeredByUser: { select: { id: true, name: true } } },
    }),
    prisma.backupRecord.count(),
  ]);
  return { items: items.map(omitStorageKey), total, page, limit };
}

async function getDownloadUrl({ backupRecordId, adminUserId }) {
  const record = await prisma.backupRecord.findUnique({ where: { id: backupRecordId } });
  if (!record) throw new ApiError(404, "Backup not found");
  if (record.status !== "COMPLETED") throw new ApiError(409, `Backup is ${record.status.toLowerCase()}, not ready for download`);

  const url = await getBackupDownloadUrl(backupRecordId);

  await prisma.$transaction(async (tx) => {
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "BACKUP_DOWNLOADED",
      entityType: "BackupRecord",
      entityId: backupRecordId,
    });
  });

  return url;
}

// Deliberately does NOT execute a restore. Actually replaying a backup
// into a live database needs care this codebase can't responsibly
// automate blind — table lock ordering, foreign-key-safe insert order,
// deciding what happens to rows created *after* the backup was taken,
// and downtime coordination are all real operational decisions a human
// needs to make. This records the request (audit-logged, so there's a
// paper trail of who asked for what and when) and returns the documented
// manual procedure instead of pretending to do it automatically.
// See /docs/backup-restore.md.
async function requestRestore({ backupRecordId, adminUserId, reason }) {
  const record = await prisma.backupRecord.findUnique({ where: { id: backupRecordId } });
  if (!record) throw new ApiError(404, "Backup not found");
  if (record.status !== "COMPLETED") throw new ApiError(409, "Only a completed backup can be restored");

  await prisma.$transaction(async (tx) => {
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "RESTORE_REQUESTED",
      entityType: "BackupRecord",
      entityId: backupRecordId,
      metadata: { reason: reason || null },
    });
  });

  return {
    acknowledged: true,
    message: "Restore requests are handled manually, not automatically, for safety. See /docs/backup-restore.md for the procedure.",
    docsPath: "/docs/backup-restore.md",
  };
}

module.exports = { trigger, list, getDownloadUrl, requestRestore };
