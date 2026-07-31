const prisma = require("../config/db");

async function logActivity({
  userId = null,
  entityType,
  entityId,
  action,
  title,
  description = null,
  metadata = null,
}) {
  try {
    await prisma.activityEvent.create({
      data: {
        userId,
        entityType,
        entityId: String(entityId),
        action,
        title,
        description,
        metadata,
      },
    });
  } catch (err) {
    // Activity logging should never break the main request.
    console.error("Activity Logger:", err.message);
  }
}

module.exports = {
  logActivity,
};