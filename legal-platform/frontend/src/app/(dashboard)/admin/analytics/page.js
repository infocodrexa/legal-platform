"use client";

import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Card } from "@/components/ui/card";
import { useAdminOverview, useAdminRevenue } from "@/lib/hooks/useAdminDashboard";

function formatCurrency(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
function monthLabel(period) {
  return new Date(`${period}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default function AdminAnalyticsPage() {
  const overviewQuery = useAdminOverview();
  const revenueQuery = useAdminRevenue({ groupBy: "month" });

  if (overviewQuery.isLoading || revenueQuery.isLoading) return <LoadingState label="Loading analytics…" />;
  if (overviewQuery.isError || revenueQuery.isError) {
    return (
      <ErrorState
        error={overviewQuery.error || revenueQuery.error}
        onRetry={() => {
          overviewQuery.refetch();
          revenueQuery.refetch();
        }}
      />
    );
  }

  const overview = overviewQuery.data;
  const buckets = revenueQuery.data ?? [];
  const maxRevenue = Math.max(1, ...buckets.map((b) => b.revenue));
  const appointmentEntries = Object.entries(overview.appointmentsByStatus || {});
  const totalAppointments = appointmentEntries.reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <div>
      <DashPageHeading title="Reports & Analytics" description="Revenue, commission, and appointment breakdowns across the platform." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total captured" value={formatCurrency(overview.revenue.totalCaptured)} icon="Wallet" accent="seal" />
        <StatCard label="Lawyer payouts" value={formatCurrency(overview.revenue.totalLawyerPayout)} icon="Gavel" accent="verified" />
        <StatCard label="Platform commission" value={formatCurrency(overview.revenue.totalPlatformCommission)} icon="ShieldCheck" accent="brass" />
        <StatCard label="Total refunded" value={formatCurrency(overview.refunds.totalRefunded)} icon="Receipt" accent="ink" trend={`${overview.refunds.refundCount} refunds`} />
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-display text-lg text-ink">Revenue over time</h2>
        {buckets.length === 0 ? (
          <p className="mt-6 text-sm text-ink-muted">No captured payments yet.</p>
        ) : (
          <div className="mt-8 flex items-end gap-5" style={{ height: 220 }}>
            {buckets.map((b) => (
              <div key={b.period} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[11px] text-ink-muted">₹{(b.revenue / 1000).toFixed(0)}k</span>
                <div className="flex w-full flex-col justify-end" style={{ height: 160 }}>
                  <div className="w-full rounded-t-sm bg-seal" style={{ height: `${Math.max((b.revenue / maxRevenue) * 160, 8)}px` }} />
                </div>
                <span className="font-mono text-[11px] uppercase text-ink-muted">{monthLabel(b.period)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg text-ink">Appointments by status</h2>
        <div className="mt-6 space-y-4">
          {appointmentEntries.map(([status, count]) => (
            <div key={status}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs uppercase tracking-wide text-ink-muted">{status.replace(/_/g, " ")}</span>
                <span className="text-ink">{count}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                <div className="h-full rounded-full bg-brass" style={{ width: `${(count / totalAppointments) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
