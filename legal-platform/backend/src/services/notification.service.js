const prisma = require("../config/db");
const { sendMail } = require("./email.service");
const whatsappService = require("./whatsapp.service");
const templates = require("./notificationTemplates");
const { interpolate } = require("../utils/interpolate");
const { ApiError } = require("../utils/apiResponse");

async function resolveTemplate(type, channel, data) {
  const normalizedChannel = String(channel || "").toUpperCase();
  const override = await prisma.messageTemplate.findUnique({
    where: { type_channel: { type, channel: normalizedChannel } },
  });

  if (override?.isActive) {
    if (normalizedChannel === "EMAIL") {
      return {
        subject: interpolate(override.subject || "Notification", data),
        text: interpolate(override.bodyText || "", data),
      };
    }
    if (normalizedChannel === "WHATSAPP") {
      return {
        templateName: override.whatsappTemplateName,
        components: [{ type: "body", parameters: [{ type: "text", text: interpolate(override.bodyText, data) }] }],
      };
    }
  }

  return templates.render(type, normalizedChannel.toLowerCase(), data);
}

async function getPreferences(userId) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

function channelAllowed(preferences, channel, type) {
  const criticalTypes = new Set([
    "APPOINTMENT_ACCEPTED", "APPOINTMENT_REJECTED", "APPOINTMENT_CANCELLED",
    "PAYMENT_CAPTURED", "PAYMENT_FAILED", "REFUND_PROCESSED", "KYC_STATUS_CHANGED",
  ]);
  if (criticalTypes.has(type)) return true;
  if (channel === "BROWSER") return preferences.inAppEnabled;
  if (channel === "EMAIL") return preferences.emailEnabled;
  if (type === "CHAT_MESSAGE_RECEIVED") return preferences.chatNotifications;
  if (type === "APPOINTMENT_REMINDER") return preferences.appointmentReminders;
  return true;
}

async function dispatchOne({ userId, userEmail, userPhone, channel, type, data, title, message, link }) {
  const preferences = await getPreferences(userId);
  if (!channelAllowed(preferences, channel, type)) {
    return prisma.notification.create({
      data: { userId, channel, type, status: "SKIPPED", payload: data, title, message, link, errorMessage: "Disabled by notification preferences" },
    });
  }

  const notification = await prisma.notification.create({
    data: { userId, channel, type, status: "PENDING", payload: data, title, message, link },
  });

  try {
    if (channel === "EMAIL") {
      const rendered = type === "ADMIN_MESSAGE" || type === "SYSTEM_ANNOUNCEMENT"
        ? { subject: title || "NyayaSetu notification", text: message || "" }
        : await resolveTemplate(type, "EMAIL", data);
      if (!userEmail) throw new Error("User has no email on file");
      await sendMail({ to: userEmail, subject: rendered.subject, text: rendered.text, html: rendered.html });
    } else if (channel === "WHATSAPP") {
      const rendered = await resolveTemplate(type, "WHATSAPP", data);
      if (!userPhone) throw new Error("User has no phone on file");
      if (!whatsappService.isConfigured()) {
        return prisma.notification.update({
          where: { id: notification.id },
          data: { status: "SKIPPED", errorMessage: "WhatsApp is not configured" },
        });
      }
      await whatsappService.sendTemplateMessage({ to: userPhone, templateName: rendered.templateName, components: rendered.components });
    }

    return prisma.notification.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date() } });
  } catch (error) {
    console.error(`[notification] ${channel} failed for ${userId}:`, error.message);
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", errorMessage: error.message },
    });
  }
}

async function notify({ user, type, data, channels = ["EMAIL"], title, message, link }) {
  return Promise.all(channels.map((channel) => dispatchOne({
    userId: user.id,
    userEmail: user.email,
    userPhone: user.phone,
    channel,
    type,
    data,
    title,
    message,
    link,
  })));
}

async function listForUser({ userId, status, isRead, page, limit }) {
  const where = { userId, ...(status && { status }), ...(typeof isRead === "boolean" && { isRead }) };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false, channel: "BROWSER" } }),
  ]);
  return { items, total, unreadCount, page, limit };
}

async function markRead({ userId, notificationId }) {
  const item = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!item) throw new ApiError(404, "Notification not found");
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true, readAt: new Date() } });
}

async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: result.count };
}

async function updatePreferences(userId, input) {
  return prisma.notificationPreference.upsert({ where: { userId }, create: { userId, ...input }, update: input });
}

async function sendAdminNotification({ adminUserId, audience, recipientIds = [], title, message, link, channels }) {
  const where = { deletedAt: null, isBanned: false };
  if (audience === "USERS") where.role = "USER";
  else if (audience === "LAWYERS") where.role = "LAWYER";
  else if (audience === "SELECTED") where.id = { in: recipientIds };
  else if (audience !== "EVERYONE") throw new ApiError(400, "Invalid notification audience");

  const recipients = await prisma.user.findMany({ where, select: { id: true, email: true, phone: true } });
  if (!recipients.length) throw new ApiError(404, "No eligible recipients found");

  const batchSize = 25;
  let sent = 0;
  for (let index = 0; index < recipients.length; index += batchSize) {
    const batch = recipients.slice(index, index + batchSize);
    await Promise.all(batch.map((user) => notify({
      user,
      type: "ADMIN_MESSAGE",
      data: { adminUserId },
      channels,
      title,
      message,
      link,
    })));
    sent += batch.length;
  }

  return { recipients: sent, channels };
}


async function listForUser({
  userId,
  status,
  isRead,
  page = 1,
  limit = 12,
}) {
  const parsedPage = Math.max(Number(page) || 1, 1);
  const parsedLimit = Math.min(
    Math.max(Number(limit) || 12, 1),
    50
  );

  const where = {
    userId,

    // Notification bell me sirf in-app notifications
    channel: "BROWSER",

    ...(status && {
      status,
    }),

    ...(typeof isRead === "boolean" && {
      isRead,
    }),
  };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),

    prisma.notification.count({
      where,
    }),

    prisma.notification.count({
      where: {
        userId,
        channel: "BROWSER",
        isRead: false,
      },
    }),
  ]);

  return {
    items,
    total,
    unreadCount,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit),
    hasNextPage: parsedPage * parsedLimit < total,
  };
}

async function getUserNotification({
  userId,
  notificationId,
}) {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        channel: "BROWSER",
      },
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found"
    );
  }

  return notification;
}

async function markRead({
  userId,
  notificationId,
}) {
  const notification = await getUserNotification({
    userId,
    notificationId,
  });

  if (notification.isRead) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

async function markUnread({
  userId,
  notificationId,
}) {
  const notification = await getUserNotification({
    userId,
    notificationId,
  });

  if (!notification.isRead) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      isRead: false,
      readAt: null,
    },
  });
}

async function markAllRead(userId) {
  const result =
    await prisma.notification.updateMany({
      where: {
        userId,
        channel: "BROWSER",
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

  return {
    updated: result.count,
  };
}

async function deleteNotification({
  userId,
  notificationId,
}) {
  const notification = await getUserNotification({
    userId,
    notificationId,
  });

  await prisma.notification.delete({
    where: {
      id: notification.id,
    },
  });

  return {
    deleted: true,
    notificationId,
  };
}

async function deleteAllForUser(userId) {
  const result =
    await prisma.notification.deleteMany({
      where: {
        userId,
        channel: "BROWSER",
      },
    });

  return {
    deleted: result.count,
  };
}

async function deleteReadForUser(userId) {
  const result =
    await prisma.notification.deleteMany({
      where: {
        userId,
        channel: "BROWSER",
        isRead: true,
      },
    });

  return {
    deleted: result.count,
  };
}

module.exports = {
  notify,
  listForUser,
  resolveTemplate,

  markRead,
  markUnread,
  markAllRead,

  deleteNotification,
  deleteAllForUser,
  deleteReadForUser,

  getPreferences,
  updatePreferences,
  sendAdminNotification,
};
