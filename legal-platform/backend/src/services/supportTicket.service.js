const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { writeAuditLog } = require("../utils/auditLog");
const { sanitizePlainText } = require("../utils/sanitize");

const PRIVILEGED_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

async function createTicket({ userId, subject, description, priority }) {
  return prisma.supportTicket.create({
    data: {
      userId,
      subject: sanitizePlainText(subject),
      description: sanitizePlainText(description),
      priority: priority || "MEDIUM",
    },
  });
}

async function getTicketForActor({ ticketId, actorUserId, actorRole }) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, role: true } } } },
    },
  });
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  const isOwner = ticket.userId === actorUserId;
  if (!isOwner && !PRIVILEGED_ROLES.has(actorRole)) {
    throw new ApiError(403, "You do not have access to this ticket");
  }
  return ticket;
}

async function addReply({ ticketId, authorId, actorRole, content }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  const isOwner = ticket.userId === authorId;
  const isPrivileged = PRIVILEGED_ROLES.has(actorRole);
  if (!isOwner && !isPrivileged) throw new ApiError(403, "You do not have access to this ticket");
  if (ticket.status === "CLOSED") throw new ApiError(409, "This ticket is closed");

  return prisma.$transaction(async (tx) => {
    const reply = await tx.supportTicketReply.create({
      data: { ticketId, authorId, content: sanitizePlainText(content) },
    });
    // An admin reply to a fresh OPEN ticket implicitly starts work on it.
    if (isPrivileged && ticket.status === "OPEN") {
      await tx.supportTicket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } });
    }
    return reply;
  });
}

async function updateStatus({ ticketId, adminUserId, status, resolutionNotes }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  const isResolving = status === "RESOLVED" || status === "CLOSED";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        resolutionNotes: resolutionNotes !== undefined ? sanitizePlainText(resolutionNotes) : ticket.resolutionNotes,
        resolvedAt: isResolving ? new Date() : ticket.resolvedAt,
      },
    });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "SUPPORT_TICKET_STATUS_CHANGED",
      entityType: "SupportTicket",
      entityId: ticketId,
      metadata: { from: ticket.status, to: status },
    });
    return updated;
  });
}

async function assignTicket({ ticketId, adminUserId, assignedToUserId }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  const assignee = await prisma.user.findUnique({ where: { id: assignedToUserId } });
  if (!assignee || !PRIVILEGED_ROLES.has(assignee.role)) {
    throw new ApiError(400, "Ticket can only be assigned to an admin");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToUserId, status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status },
    });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "SUPPORT_TICKET_ASSIGNED",
      entityType: "SupportTicket",
      entityId: ticketId,
      metadata: { assignedToUserId },
    });
    return updated;
  });
}

async function listMyTickets({ userId, status, page, limit }) {
  const where = { userId, ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.supportTicket.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function listAllTickets({ status, priority, page, limit }) {
  const where = { ...(status && { status }), ...(priority && { priority }) };
  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ]);
  return { items, total, page, limit };
}

module.exports = { createTicket, getTicketForActor, addReply, updateStatus, assignTicket, listMyTickets, listAllTickets };
