"use client";

import { useState } from "react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { useAdminAppointments } from "@/lib/hooks/useAdminDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const statusFilters = ["", "REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED", "REJECTED", "RESCHEDULED"];

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useAdminAppointments({
    ...(statusFilter && { status: statusFilter }),
    page: 1,
    limit: 50,
  });
  const appointments = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Appointments" description="Platform-wide appointment oversight." />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading appointments…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Lawyer</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Scheduled</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-medium text-ink">{a.user?.name}</td>
                  <td className="px-5 py-4 text-ink-muted">{a.lawyerProfile?.user?.name}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{formatDateTime(a.scheduledStart)}</td>
                  <td className="hidden px-5 py-4 font-mono text-ink-muted md:table-cell">₹{a.consultationCharge}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No appointments match this filter.</p>}
        </div>
      )}
    </div>
  );
}
