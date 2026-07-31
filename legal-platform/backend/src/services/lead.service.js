const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { sanitizePlainText } = require("../utils/sanitize");
const { writeAuditLog } = require("../utils/auditLog");
const { sendMail } = require("./email.service");

async function create({ name, email, phone, topic, message }) {
  const lead = await prisma.lead.create({
    data: {
      name: sanitizePlainText(name),
      email,
      phone: phone || null,
      topic: topic ? sanitizePlainText(topic) : null,
      message: sanitizePlainText(message),
    },
  });

  // Best-effort confirmation email — a lead should never fail to save just
  // because the mail server hiccuped. Sent directly (not through
  // notification.service.js) because a lead usually has no User account
  // yet, and Notification.userId is a required field — there's no row to
  // attach a tracked Notification to here.
  sendMail({
    to: email,
    subject: "We've received your message",
    text: `Hi ${name}, thanks for reaching out — we typically reply within one business day.`,
    html: `<p>Hi ${name}, thanks for reaching out — we typically reply within one business day.</p>`,
  }).catch((err) => console.error(`[lead] confirmation email failed for ${lead.id}:`, err.message));

  return lead;
}

async function getById(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { assignedToUser: { select: { id: true, name: true, email: true } } },
  });
  if (!lead) throw new ApiError(404, "Lead not found");
  return lead;
}

async function update({ leadId, status, notes, assignedToUserId, adminUserId }) {
  const existing = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existing) throw new ApiError(404, "Lead not found");

  if (assignedToUserId) {
    const assignee = await prisma.user.findUnique({ where: { id: assignedToUserId } });
    if (!assignee || !["ADMIN", "SUPER_ADMIN"].includes(assignee.role)) {
      throw new ApiError(400, "Leads can only be assigned to an admin");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: leadId },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes ? sanitizePlainText(notes) : null }),
        ...(assignedToUserId !== undefined && { assignedToUserId }),
      },
    });
    await writeAuditLog(tx, {
      actorUserId: adminUserId,
      actorRole: "ADMIN",
      action: "LEAD_UPDATED",
      entityType: "Lead",
      entityId: leadId,
      metadata: { status, assignedToUserId },
    });
    return updated;
  });
}

async function list({ status, assignedToUserId, page, limit }) {
  const where = { ...(status && { status }), ...(assignedToUserId && { assignedToUserId }) };
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { assignedToUser: { select: { id: true, name: true } } },
    }),
    prisma.lead.count({ where }),
  ]);
  return { items, total, page, limit };
}

module.exports = { create, getById, update, list };
