"use client";

import Link from "next/link";
import { Gavel, FileText, LifeBuoy, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Card } from "@/components/ui/card";
import { useAdminOverview, useAdminRevenue, useAdminTickets } from "@/lib/hooks/useAdminDashboard";

function formatCurrency(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
function monthLabel(period) {
  return new Date(`${period}-01`).toLocaleDateString("en-IN", { month: "short" });
}

export default function AdminOverviewPage() {
  const overviewQuery = useAdminOverview();
  const revenueQuery = useAdminRevenue({ groupBy: "month" });
  const ticketsQuery = useAdminTickets({ page: 1, limit: 3 });

  if (overviewQuery.isLoading || revenueQuery.isLoading || ticketsQuery.isLoading) {
    return <LoadingState label="Loading overview…" />;
  }
  if (overviewQuery.isError || revenueQuery.isError || ticketsQuery.isError) {
    return (
      <ErrorState
        error={overviewQuery.error || revenueQuery.error || ticketsQuery.error}
        onRetry={() => {
          overviewQuery.refetch();
          revenueQuery.refetch();
          ticketsQuery.refetch();
        }}
      />
    );
  }

  const stats = overviewQuery.data;
  const revenueByMonth = (revenueQuery.data ?? []).slice(-6);
  const tickets = ticketsQuery.data?.data ?? [];
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.revenue), 1);

  return (
    <div>
      <DashPageHeading title="Platform overview" description="A snapshot of users, lawyers, revenue, and what needs attention." />

      {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers.toLocaleString("en-IN")} icon="Users" accent="ink" />
        <StatCard label="Verified lawyers" value={`${stats.verifiedLawyers} / ${stats.totalLawyers}`} icon="Gavel" accent="verified" trend={`${stats.pendingKyc} pending KYC`} />
        <StatCard label="Revenue captured" value={formatCurrency(stats.revenue.totalCaptured)} icon="Wallet" accent="seal" trend={`${stats.revenue.transactionCount} transactions`} />
        <StatCard label="Platform commission" value={formatCurrency(stats.revenue.totalPlatformCommission)} icon="ShieldCheck" accent="brass" />
      </div> */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

  <Link href="/admin/users">
    <StatCard
      label="Total users"
      value={stats.totalUsers.toLocaleString("en-IN")}
      icon="Users"
      accent="ink"
      className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    />
  </Link>

  <Link href="/admin/lawyers">
    <StatCard
      label="Verified lawyers"
      value={`${stats.verifiedLawyers} / ${stats.totalLawyers}`}
      icon="Gavel"
      accent="verified"
      trend={`${stats.pendingKyc} pending KYC`}
      className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    />
  </Link>

  <Link href="/admin/payments">
    <StatCard
      label="Revenue captured"
      value={formatCurrency(stats.revenue.totalCaptured)}
      icon="Wallet"
      accent="seal"
      trend={`${stats.revenue.transactionCount} transactions`}
      className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    />
  </Link>

  <Link href="/admin/analytics">
    <StatCard
      label="Platform commission"
      value={formatCurrency(stats.revenue.totalPlatformCommission)}
      icon="ShieldCheck"
      accent="brass"
      className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    />
  </Link>

</div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Revenue, last 6 months</h2>
            <Link href="/admin/analytics" className="text-sm font-medium text-seal hover:underline">
              Full report
            </Link>
          </div>
          {revenueByMonth.length === 0 ? (
            <p className="mt-8 text-sm text-ink-muted">No revenue recorded yet.</p>
          ) : (
            <div className="mt-8 flex items-end gap-4" style={{ height: 180 }}>
              {revenueByMonth.map((r) => (
                <div key={r.period} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-muted">₹{(r.revenue / 1000).toFixed(0)}k</span>
                  <div className="w-full rounded-t-sm bg-seal" style={{ height: `${Math.max((r.revenue / maxRevenue) * 130, 6)}px` }} />
                  <span className="font-mono text-[10px] uppercase text-ink-muted">{monthLabel(r.period)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg text-ink">Needs attention</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link href="/admin/lawyers" className="flex items-center justify-between rounded-sm px-3 py-2.5 hover:bg-ink/[0.03]">
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <Gavel className="h-4 w-4 text-brass" /> KYC awaiting review
                </span>
                <span className="font-mono text-sm text-ink">{stats.pendingKyc}</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/documents" className="flex items-center justify-between rounded-sm px-3 py-2.5 hover:bg-ink/[0.03]">
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <FileText className="h-4 w-4 text-brass" /> Documents in review queue
                </span>
                <span className="font-mono text-sm text-ink">{stats.pendingDocuments}</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/support" className="flex items-center justify-between rounded-sm px-3 py-2.5 hover:bg-ink/[0.03]">
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <LifeBuoy className="h-4 w-4 text-brass" /> Open support tickets
                </span>
                <span className="font-mono text-sm text-ink">{stats.openSupportTickets}</span>
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent support tickets</h2>
          <Link href="/admin/support" className="inline-flex items-center gap-1 text-sm font-medium text-seal hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {tickets.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No tickets yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-paper-line">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{t.subject}</p>
                  <p className="text-xs text-ink-muted">{t.user?.name}</p>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
