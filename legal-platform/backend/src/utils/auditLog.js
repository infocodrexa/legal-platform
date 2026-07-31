// Every call here is an INSERT and nothing else. No update/delete helper is
// exported on purpose (Sec 2.8 — audit logs must be append-only). `tx` lets
// callers write the audit row inside the same transaction as the state
// change it's describing, so the two can never disagree.
async function writeAuditLog(tx, { actorUserId = null, actorRole = null, action, entityType, entityId, metadata = null }) {
  return tx.auditLog.create({
    data: { actorUserId, actorRole, action, entityType, entityId, metadata },
  });
}

module.exports = { writeAuditLog };
