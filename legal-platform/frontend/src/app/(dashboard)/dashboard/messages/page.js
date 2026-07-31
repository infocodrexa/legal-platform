"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, MessageSquare, Paperclip, Loader2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { cn } from "@/lib/utils";
import { useMyAppointments } from "@/lib/hooks/useUserDashboard";
import { useAppointmentChat } from "@/lib/hooks/useAppointmentChat";
import { useAuth } from "@/lib/auth-context";
import { chatApi } from "@/lib/api";

function formatTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Chat only opens for ACCEPTED/COMPLETED appointments — matches the
// backend's CHAT_ENABLED_STATUSES in chat.service.js exactly. There's no
// standalone "conversation list" endpoint; the appointment list itself is
// the source of who you can message.
const CHAT_ENABLED_STATUSES = ["ACCEPTED", "COMPLETED"];

export default function MessagesPage() {
  const { user } = useAuth();
  const appointmentsQuery = useMyAppointments({ page: 1, limit: 50 });
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const conversations = useMemo(
    () => (appointmentsQuery.data?.data ?? []).filter((a) => CHAT_ENABLED_STATUSES.includes(a.status)),
    [appointmentsQuery.data]
  );

  // Derived, not stored separately — defaults to the first conversation
  // without needing an effect just to initialize one piece of state from
  // another.
  const activeId = selectedId ?? conversations[0]?.id ?? null;
  const setActiveId = setSelectedId;

  const { connected, messages, setMessages, typingUserId, error: socketError, sendMessage, setTyping, markRead } =
    useAppointmentChat(activeId);

  // Load message history over REST on thread switch — the socket only
  // carries messages sent *after* joining, not history.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const { data } = await chatApi.history(activeId, { page: 1, limit: 50 });
        if (!cancelled) setMessages(data.data);
      } catch {
        // non-fatal — the thread just opens empty; the socket connection
        // above still carries new messages either way
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [activeId, setMessages]);

  useEffect(() => {
    if (activeId && messages.length > 0) markRead();
  }, [activeId, messages.length, markRead]);

  const active = conversations.find((c) => c.id === activeId);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSendError("");
    try {
      await sendMessage(draft.trim());
      setDraft("");
      setTyping(false);
    } catch (err) {
      setSendError(getErrorMessage(err, "Message failed to send."));
    }
  }

  if (appointmentsQuery.isLoading) return <LoadingState label="Loading your conversations…" />;
  if (appointmentsQuery.isError) return <ErrorState error={appointmentsQuery.error} onRetry={appointmentsQuery.refetch} />;

  if (conversations.length === 0) {
    return (
      <div>
        <DashPageHeading title="Messages" description="Conversations with lawyers you've consulted." />
        <EmptyState icon="MessageSquare" title="No conversations yet" description="Messages open up once a lawyer accepts your consultation request." />
      </div>
    );
  }

  return (
    <div>
      <DashPageHeading title="Messages" description="Conversations with lawyers you've consulted." />

      <div className="grid grid-cols-1 overflow-hidden rounded-card border border-paper-line bg-paper-raised md:grid-cols-[280px_1fr]">
        <div className="divide-y divide-paper-line border-b border-paper-line md:border-b-0 md:border-r">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "flex w-full flex-col items-start gap-1 px-4 py-3.5 text-left transition-colors",
                activeId === c.id ? "bg-seal-wash" : "hover:bg-ink/[0.02]"
              )}
            >
              <span className="text-sm font-medium text-ink">{c.lawyerProfile?.user?.name || "Lawyer"}</span>
              <span className="font-mono text-[10px] text-ink-muted/70">{formatTime(c.scheduledStart)}</span>
            </button>
          ))}
        </div>

        <div className="flex h-[520px] flex-col">
          <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
            <p className="font-medium text-ink">{active?.lawyerProfile?.user?.name || "Lawyer"}</p>
            <span className={cn("h-2 w-2 rounded-full", connected ? "bg-verified" : "bg-ink-muted/40")} title={connected ? "Connected" : "Connecting…"} />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {historyLoading ? (
              <LoadingState label="Loading messages…" />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex", m.senderId === user?.id ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-card px-4 py-2.5 text-sm",
                      m.senderId === user?.id ? "bg-ink text-cream-white" : "bg-cream-white border border-paper-line text-ink"
                    )}
                  >
                    {m.content && <p>{m.content}</p>}
                    {m.attachmentUrl && (
                      <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs underline">
                        <Paperclip className="h-3 w-3" /> {m.attachmentFileName || "Attachment"}
                      </a>
                    )}
                    <p className={cn("mt-1 font-mono text-[10px]", m.senderId === user?.id ? "text-paper/50" : "text-ink-muted")}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {typingUserId && typingUserId !== user?.id && (
              <p className="text-xs text-ink-muted">Typing…</p>
            )}
          </div>

          {sendError && <p className="px-5 pb-1 text-xs text-seal">{sendError}</p>}
          {socketError && <p className="px-5 pb-1 text-xs text-seal">{socketError}</p>}

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-paper-line p-3">
            <input
              type="text"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setTyping(e.target.value.length > 0);
              }}
              onBlur={() => setTyping(false)}
              className="flex-1 rounded-sm border border-ink/20 bg-cream-white px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:border-seal focus-visible:ring-1 focus-visible:ring-seal"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-seal text-cream-white hover:bg-seal-soft disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
