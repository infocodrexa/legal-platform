"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { useAdminLawyers } from "@/lib/hooks/useAdminDashboard";

const statusFilters = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminLawyersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useAdminLawyers({
    ...(statusFilter && { kycStatus: statusFilter }),
    page: 1,
    limit: 50,
  });
  const lawyers = data?.data ?? [];
  const pendingCount = lawyers.filter((l) => ["PENDING", "UNDER_REVIEW"].includes(l.kycStatus)).length;

  return (
    <div>
      <DashPageHeading title="Lawyers & KYC" description={`${data?.meta?.total ?? 0} lawyer profiles · ${pendingCount} shown awaiting a KYC decision.`} />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.value ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading lawyers…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Lawyer</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Bar Council ID</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Experience</th>
                <th className="px-5 py-3 font-medium">KYC status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {lawyers.map((l) => (
                <tr key={l.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/lawyers/${l.id}`} className="font-medium text-ink hover:text-seal">
                      {l.user?.name}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-4 font-mono text-xs text-ink-muted md:table-cell">{l.barCouncilId}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{l.experienceYears} yrs</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={l.kycStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/lawyers/${l.id}`} className="text-ink-muted hover:text-seal">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lawyers.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No lawyers match this filter.</p>}
        </div>
      )}
    </div>
  );
}
