"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { useLawyerEarnings } from "@/lib/hooks/useLawyerDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function EarningsPage() {
  const { data, isLoading, isError, error, refetch } = useLawyerEarnings({ page: 1, limit: 50 });
  const payments = data?.data ?? [];
  const totalEarnings = data?.meta?.totalEarnings ?? 0;
  const settledCount = payments.filter((p) => p.status === "SETTLED").length;

  if (isLoading) return <LoadingState label="Loading your earnings…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <DashPageHeading title="Earnings" description="Payments received for your consultations, after platform commission." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total earned" icon="Wallet" accent="verified" value={`₹${Number(totalEarnings).toLocaleString("en-IN")}`} />
        <StatCard label="Settled payouts" icon="CreditCard" accent="ink" value={settledCount} />
        <StatCard label="Total transactions" icon="Receipt" accent="brass" value={payments.length} />
      </div>

      <div className="mt-8">
        {payments.length === 0 ? (
          <EmptyState icon="Wallet" title="No earnings yet" description="Payments from completed, paid consultations appear here." />
        ) : (
          <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Date</th>
                  <th className="px-5 py-3 font-medium">Your payout</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-ink/[0.015]">
                    <td className="px-5 py-4 font-medium text-ink">{p.user?.name}</td>
                    <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-4 font-mono text-ink">₹{Number(p.lawyerPayout).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
