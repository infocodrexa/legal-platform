const { Server } = require("socket.io");
const env = require("../config/env");
const { verifyAccessToken } = require("../utils/jwt");
const prisma = require("../config/db");
const chatService = require("../services/chat.service");

const room = (appointmentId) => `appointment:${appointmentId}`;

// userId -> Set<socketId>. A user can have multiple tabs/devices open;
// they're "online" as long as at least one socket is connected. Used to
// decide whether a chat message also needs an email nudge (see
// chat.service.js#sendMessage).
const onlineUsers = new Map();

function markOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}
function markOffline(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
}
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    },
  });

  // Handshake auth: client connects with `io(url, { auth: { token } })`
  // where token is the same JWT access token used for REST calls.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt || user.isBanned) return next(new Error("Account not accessible"));

      socket.user = { id: user.id, role: user.role };
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    markOnline(socket.user.id, socket.id);

    socket.on("chat:join", async ({ appointmentId }, ack) => {
      try {
        await chatService.assertParticipant(appointmentId, socket.user.id);
        socket.join(room(appointmentId));
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("chat:message", async (payload, ack) => {
      try {
        const { appointmentId, content, attachmentKey, attachmentFileName, attachmentMimeType } = payload;

        // Need to know who the recipient is before we can check presence —
        // assertParticipant is cheap (indexed PK lookups) and sendMessage
        // re-validates internally anyway, so the extra call is fine.
        const { otherUser } = await chatService.assertParticipant(appointmentId, socket.user.id);
        const receiverOnline = isUserOnline(otherUser.id);

        const message = await chatService.sendMessage({
          appointmentId,
          senderId: socket.user.id,
          content,
          attachmentKey,
          attachmentFileName,
          attachmentMimeType,
          isReceiverOnline: receiverOnline,
        });

        io.to(room(appointmentId)).emit("chat:message", message);
        ack?.({ success: true, data: message });
      } catch (err) {
        ack?.({ success: false, message: err.message });
        socket.emit("chat:error", { message: err.message });
      }
    });

    socket.on("chat:typing", ({ appointmentId, isTyping }) => {
      socket.to(room(appointmentId)).emit("chat:typing", { userId: socket.user.id, isTyping: !!isTyping });
    });

    socket.on("chat:read", async ({ appointmentId }, ack) => {
      try {
        const { readAt, messageIds } = await chatService.markRead({ appointmentId, actorUserId: socket.user.id });
        if (messageIds.length > 0) {
          io.to(room(appointmentId)).emit("chat:read", { userId: socket.user.id, appointmentId, readAt, messageIds });
        }
        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("disconnect", () => {
      markOffline(socket.user.id, socket.id);
    });
  });

  return io;
}

module.exports = { initSocket, isUserOnline };
