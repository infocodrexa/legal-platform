const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");

async function upsert({ type, channel, subject, bodyText, whatsappTemplateName, isActive, adminUserId }) {
  const data = {
    subject: subject || null,
    bodyText,
    whatsappTemplateName: whatsappTemplateName || null,
    isActive: isActive ?? true,
    updatedByUserId: adminUserId,
  };

  return prisma.messageTemplate.upsert({
    where: { type_channel: { type, channel } },
    create: { type, channel, ...data },
    update: data,
  });
}

async function list({ type, channel, page, limit }) {
  const where = { ...(type && { type }), ...(channel && { channel }) };
  const [items, total] = await Promise.all([
    prisma.messageTemplate.findMany({ where, orderBy: [{ type: "asc" }, { channel: "asc" }], skip: (page - 1) * limit, take: limit }),
    prisma.messageTemplate.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function remove(templateId) {
  const existing = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
  if (!existing) throw new ApiError(404, "Message template not found");
  await prisma.messageTemplate.delete({ where: { id: templateId } });
}

// Renders exactly what would be sent — reuses notification.service's own
// resolveTemplate so "preview" can never drift from "actual send behavior".
async function preview({ type, channel, sampleData }) {
  const defaultSample = {
    counterpartyName: "Adv. Jane Doe",
    scheduledStart: new Date(),
    amount: 1500,
    currency: "INR",
    status: "VERIFIED",
    category: "IDENTITY_PROOF",
    senderName: "Alice",
    preview: "Hi, quick question about my case.",
  };
  const rendered = await notificationService.resolveTemplate(type, channel, { ...defaultSample, ...sampleData });
  if (!rendered) throw new ApiError(404, `No template (DB override or static) found for ${type}/${channel}`);
  return rendered;
}

module.exports = { upsert, list, remove, preview };
