"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "@/lib/api";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

// One socket connection per appointment thread, matching backend/src/realtime/socket.js:
// - auth handshake via socket.handshake.auth.token (same access token as REST)
// - chat:join / chat:message / chat:typing / chat:read events
export function useAppointmentChat(appointmentId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUserId, setTypingUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId) return;

    const token = getAccessToken();
    if (!token) return; // AuthProvider hasn't restored the session yet

    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("chat:join", { appointmentId }, (ack) => {
        if (!ack?.success) setError(ack?.message || "Couldn't join this conversation.");
      });
    });
    socket.on("connect_error", (err) => setError(err.message));
    socket.on("disconnect", () => setConnected(false));

    socket.on("chat:message", (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
    socket.on("chat:typing", ({ isTyping, userId }) => {
      setTypingUserId(isTyping ? userId : null);
    });
    socket.on("chat:error", ({ message }) => setError(message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appointmentId]);

  const sendMessage = useCallback((content, attachment) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error("Not connected"));
      socketRef.current.emit(
        "chat:message",
        { appointmentId, content, ...attachment },
        (ack) => (ack?.success ? resolve(ack.data) : reject(new Error(ack?.message || "Message failed to send")))
      );
    });
  }, [appointmentId]);

  const setTyping = useCallback((isTyping) => {
    socketRef.current?.emit("chat:typing", { appointmentId, isTyping });
  }, [appointmentId]);

  const markRead = useCallback(() => {
    socketRef.current?.emit("chat:read", { appointmentId }, () => {});
  }, [appointmentId]);

  return { connected, messages, setMessages, typingUserId, error, sendMessage, setTyping, markRead };
}
