"use client";

import { useState } from "react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { documentCategoryLabels } from "@/lib/constants";
import { useAdminDocuments } from "@/lib/hooks/useAdminDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const statusFilters = ["", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "REUPLOAD_REQUIRED"];

export default function AdminDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useAdminDocuments({
    ...(statusFilter && { status: statusFilter }),
    page: 1,
    limit: 50,
  });
  const documents = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Documents" description="Platform-wide document oversight — verification itself happens in the lawyer review queue." />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {s ? s.replace(/_/g, " ") : "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading documents…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Document</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Client</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Category</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Uploaded</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-medium text-ink">{doc.originalFileName}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{doc.user?.name}</td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{documentCategoryLabels[doc.category]}</td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{formatDate(doc.createdAt)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {documents.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No documents match this filter.</p>}
        </div>
      )}
    </div>
  );
}
