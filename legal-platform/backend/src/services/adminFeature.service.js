const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { writeAuditLog } = require("../utils/auditLog");

async function globalSearch({ query, page, limit }) {
  const q = query.trim();
  const skip = (page - 1) * limit;
  const [users, appointments, payments, documents] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }, take: limit, skip,
    }),
    prisma.appointment.findMany({
      where: { id: { contains: q, mode: "insensitive" } },
      select: { id: true, status: true, scheduledStart: true, user: { select: { name: true } }, lawyerProfile: { select: { user: { select: { name: true } } } } }, take: limit, skip,
    }),
    prisma.payment.findMany({
      where: { OR: [{ id: { contains: q, mode: "insensitive" } }, { razorpayPaymentId: { contains: q, mode: "insensitive" } }, { razorpayOrderId: { contains: q, mode: "insensitive" } }] },
      select: { id: true, status: true, amount: true, createdAt: true, user: { select: { name: true } } }, take: limit, skip,
    }),
    prisma.document.findMany({
      where: { deletedAt: null, OR: [{ id: { contains: q, mode: "insensitive" } }, { originalFileName: { contains: q, mode: "insensitive" } }] },
      select: { id: true, originalFileName: true, status: true, category: true, createdAt: true, user: { select: { name: true } } }, take: limit, skip,
    }),
  ]);
  return { users, appointments, payments, documents, page, limit };
}

async function listTimeline({ entityType, entityId, page, limit }) {
  const where = { entityType, entityId };
  const [items, total] = await Promise.all([
    prisma.activityEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.activityEvent.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function addTimelineEvent({ userId, entityType, entityId, action, title, description, metadata }) {
  return prisma.activityEvent.create({ data: { userId, entityType, entityId, action, title, description, metadata } });
}

async function listNotes({ entityType, entityId, page, limit }) {
  const where = { entityType, entityId };
  const [items, total] = await Promise.all([
    prisma.adminNote.findMany({ where, include: { authorUser: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.adminNote.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function addNote({ adminUserId, entityType, entityId, subjectUserId, note }) {
  const created = await prisma.adminNote.create({ data: { authorUserId: adminUserId, entityType, entityId, subjectUserId, note }, include: { authorUser: { select: { id: true, name: true } } } });
  await writeAuditLog(prisma, { actorUserId: adminUserId, actorRole: "ADMIN", action: "ADMIN_NOTE_CREATED", entityType, entityId, metadata: { noteId: created.id } });
  return created;
}

async function updateNote({ adminUserId, noteId, note }) {
  const existing = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!existing) throw new ApiError(404, "Admin note not found");
  const updated = await prisma.adminNote.update({ where: { id: noteId }, data: { note } });
  await writeAuditLog(prisma, { actorUserId: adminUserId, actorRole: "ADMIN", action: "ADMIN_NOTE_UPDATED", entityType: existing.entityType, entityId: existing.entityId, metadata: { noteId } });
  return updated;
}

async function deleteNote({ adminUserId, noteId }) {
  const existing = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!existing) throw new ApiError(404, "Admin note not found");
  await prisma.adminNote.delete({ where: { id: noteId } });
  await writeAuditLog(prisma, { actorUserId: adminUserId, actorRole: "ADMIN", action: "ADMIN_NOTE_DELETED", entityType: existing.entityType, entityId: existing.entityId, metadata: { noteId } });
  return { deleted: true };
}

module.exports = { globalSearch, listTimeline, addTimelineEvent, listNotes, addNote, updateNote, deleteNote };
