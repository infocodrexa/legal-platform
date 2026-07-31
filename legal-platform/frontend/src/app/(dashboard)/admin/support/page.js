"use client";

import { useState } from "react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAdminTickets, useUpdateTicketStatus } from "@/lib/hooks/useAdminDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const priorityVariant = { URGENT: "seal", HIGH: "seal", MEDIUM: "brass", LOW: "ink" };
const nextStatus = { OPEN: "IN_PROGRESS", IN_PROGRESS: "RESOLVED", RESOLVED: "CLOSED" };

export default function AdminSupportPage() {
  const { data, isLoading, isError, error, refetch } = useAdminTickets({ page: 1, limit: 50 });
  const updateStatusMutation = useUpdateTicketStatus();
  const [actionError, setActionError] = useState("");
  const tickets = data?.data ?? [];

  async function handleAdvance(ticket) {
    const status = nextStatus[ticket.status];
    if (!status) return;
    setActionError("");
    try {
      await updateStatusMutation.mutateAsync({ id: ticket.id, status });
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't update this ticket."));
    }
  }

  return (
    <div>
      <DashPageHeading title="Support Tickets" description="Every ticket raised by a user or lawyer, priority-ordered." />

      {actionError && <p className="mb-4 text-sm text-seal">{actionError}</p>}

      {isLoading ? (
        <LoadingState label="Loading tickets…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : tickets.length === 0 ? (
        <EmptyState icon="LifeBuoy" title="No tickets" description="Support tickets from users and lawyers appear here." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{t.subject}</p>
                <p className="text-xs text-ink-muted">{t.user?.name} · {formatDate(t.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge>
                <StatusBadge status={t.status} />
                {nextStatus[t.status] && (
                  <button
                    onClick={() => handleAdvance(t)}
                    disabled={updateStatusMutation.isPending}
                    className="text-sm font-medium text-seal hover:underline disabled:opacity-50"
                  >
                    Mark {nextStatus[t.status].replace("_", " ").toLowerCase()}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
