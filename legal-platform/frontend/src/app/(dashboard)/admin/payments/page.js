"use client";

import { useState } from "react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { useAdminPayments } from "@/lib/hooks/useAdminDashboard";

const statusFilters = ["", "CREATED", "CAPTURED", "SETTLED", "FAILED", "REFUNDED"];

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useAdminPayments({
    ...(statusFilter && { status: statusFilter }),
    page: 1,
    limit: 50,
  });
  const payments = data?.data ?? [];
  const totalCommission = payments.reduce((sum, p) => sum + Number(p.platformCommission), 0);

  return (
    <div>
      <DashPageHeading title="Payments" description={`Platform-wide payment ledger · ₹${totalCommission.toLocaleString("en-IN")} commission shown below.`} />

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
        <LoadingState label="Loading payments…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Lawyer</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Amount</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Commission</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-medium text-ink">{p.user?.name}</td>
                  <td className="px-5 py-4 text-ink-muted">{p.lawyerProfile?.barCouncilId}</td>
                  <td className="hidden px-5 py-4 font-mono text-ink sm:table-cell">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                  <td className="hidden px-5 py-4 font-mono text-ink-muted md:table-cell">₹{Number(p.platformCommission).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No payments match this filter.</p>}
        </div>
      )}
    </div>
  );
}
