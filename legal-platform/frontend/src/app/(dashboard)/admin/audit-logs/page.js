"use client";

import { ScrollText } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { useAuditLogs } from "@/lib/hooks/useAdminDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminAuditLogsPage() {
  const { data, isLoading, isError, error, refetch } = useAuditLogs({ page: 1, limit: 100 });
  const logs = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Audit Logs" description="Append-only. Every payment, KYC, ban, and refund action is recorded here and can never be edited or deleted." />

      <div className="flex items-start gap-3 rounded-card border border-brass/30 bg-brass-wash p-4 mb-6">
        <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
        <p className="text-sm text-ink">
          This view is read-only by design — the backend never exposes an update or delete
          operation for audit log rows, matching the compliance requirement that these records
          stay immutable.
        </p>
      </div>

      {isLoading ? (
        <LoadingState label="Loading audit logs…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : logs.length === 0 ? (
        <EmptyState icon="FileText" title="No audit log entries" description="Actions taken across the platform will appear here." />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Entity</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Actor</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-mono text-xs text-ink">{log.action}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{log.entityType} · {log.entityId}</td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{log.actorUser?.name || log.actorRole || "System"}</td>
                  <td className="px-5 py-4 text-ink-muted">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
