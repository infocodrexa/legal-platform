"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Input } from "@/components/ui/input";
import { useAdminLeads } from "@/lib/hooks/useAdminDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const statusFilters = ["ALL", "NEW", "CONTACTED", "CONVERTED", "CLOSED"];

export default function AdminLeadsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data, isLoading, isError, error, refetch } = useAdminLeads({
    ...(status !== "ALL" && { status }),
    page: 1,
    limit: 100,
  });

  // Search is genuinely functional (client-side, over the fetched page) —
  // the backend's GET /leads doesn't have a text-search param, so this
  // filters what's already been fetched rather than being fake.
  const leads = (data?.data ?? []).filter((lead) => {
    const q = query.trim().toLowerCase();
    return !q || lead.name.toLowerCase().includes(q) || lead.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <DashPageHeading title="Leads" description="Contact-form submissions." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input placeholder="Search by name or email" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading leads…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : leads.length === 0 ? (
        <EmptyState icon="Inbox" title="No leads match" description="Try a different search term or status filter." />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Topic</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Received</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink hover:text-seal">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-ink-muted">{lead.email}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{lead.topic || "—"}</td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{formatDate(lead.createdAt)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/leads/${lead.id}`} className="text-ink-muted hover:text-seal">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
