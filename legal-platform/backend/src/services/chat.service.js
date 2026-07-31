const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const { getSignedDownloadUrl } = require("../utils/s3");
const { sanitizePlainText } = require("../utils/sanitize");
const notificationService = require("./notification.service");

// Chat only makes sense once the lawyer has accepted (there's an actual
// consultation relationship) and stays open through completion for
// follow-up questions. Not available on REQUESTED/REJECTED/CANCELLED.
const CHAT_ENABLED_STATUSES = new Set(["ACCEPTED", "COMPLETED"]);

// Raw S3 key should never leave the backend — only a signed attachmentUrl.
function omitAttachmentKey(message) {
  const { attachmentKey, ...safe } = message;
  return safe;
}

// Confirms the actor is either the client or the lawyer on this
// appointment and that chat is currently allowed, returning enough info to
// address a message to "the other side" without a second query.
async function assertParticipant(appointmentId, actorUserId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { user: true, lawyerProfile: { include: { user: true } } },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isClient = appointment.userId === actorUserId;
  const isLawyer = appointment.lawyerProfile.userId === actorUserId;
  if (!isClient && !isLawyer) throw new ApiError(403, "You are not a participant in this conversation");

  if (!CHAT_ENABLED_STATUSES.has(appointment.status)) {
    throw new ApiError(409, `Chat is not available for an appointment with status ${appointment.status}`);
  }

  const other = isClient ? appointment.lawyerProfile.user : appointment.user;
  return { appointment, isClient, isLawyer, otherUser: other };
}

async function sendMessage({ appointmentId, senderId, content, attachmentKey, attachmentFileName, attachmentMimeType, isReceiverOnline }) {
  if (!content && !attachmentKey) {
    throw new ApiError(400, "Message must have text content or an attachment");
  }

  const { otherUser } = await assertParticipant(appointmentId, senderId);
  const cleanContent = content ? sanitizePlainText(content) : null;

  const message = await prisma.chatMessage.create({
    data: {
      appointmentId,
      senderId,
      receiverId: otherUser.id,
      content: cleanContent,
      attachmentKey: attachmentKey || null,
      attachmentFileName: attachmentFileName || null,
      attachmentMimeType: attachmentMimeType || null,
    },
  });

  // Only email if the recipient isn't actively connected — avoids emailing
  // someone mid-conversation for every single message.
  if (!isReceiverOnline) {
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
    notificationService
      .notify({
        user: otherUser,
        type: "CHAT_MESSAGE_RECEIVED",
        data: { senderName: sender.name, preview: (content || "[attachment]").slice(0, 140) },
        channels: ["BROWSER", "EMAIL"],
      })
      .catch((err) => console.error(`[chat] notify failed for message ${message.id}:`, err.message));
  }

  const attachmentUrl = message.attachmentKey ? await getSignedDownloadUrl(message.attachmentKey) : null;
  return { ...omitAttachmentKey(message), attachmentUrl };
}

async function listMessages({ appointmentId, actorUserId, page, limit }) {
  await assertParticipant(appointmentId, actorUserId);

  const [items, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { appointmentId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.chatMessage.count({ where: { appointmentId } }),
  ]);

  const withUrls = await Promise.all(
    items.map(async (m) => ({
      ...omitAttachmentKey(m),
      attachmentUrl: m.attachmentKey ? await getSignedDownloadUrl(m.attachmentKey) : null,
    }))
  );

  return { items: withUrls.reverse(), total, page, limit }; // reverse -> chronological order for the page
}

// Marks every unread message addressed to actorUserId in this appointment
// as read, and returns the ids so the caller can broadcast a read receipt.
async function markRead({ appointmentId, actorUserId }) {
  await assertParticipant(appointmentId, actorUserId);

  const unread = await prisma.chatMessage.findMany({
    where: { appointmentId, receiverId: actorUserId, readAt: null },
    select: { id: true },
    take: 1000, // defense in depth — naturally bounded per-appointment already
  });
  if (unread.length === 0) return { readAt: null, messageIds: [] };

  const readAt = new Date();
  await prisma.chatMessage.updateMany({
    where: { id: { in: unread.map((m) => m.id) } },
    data: { readAt },
  });

  return { readAt, messageIds: unread.map((m) => m.id) };
}

module.exports = { assertParticipant, sendMessage, listMessages, markRead, CHAT_ENABLED_STATUSES };
