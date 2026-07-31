"use client";

import Link from "next/link";
import { FileText, Upload, ChevronRight } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { documentCategoryLabels } from "@/lib/constants";
import { useDocuments } from "@/lib/hooks/useUserDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DocumentsPage() {
  const { data, isLoading, isError, error, refetch } = useDocuments({ page: 1, limit: 50 });
  const documents = data?.data ?? [];

  return (
    <div>
      <DashPageHeading
        title="My Documents"
        description="Every document you've submitted for review, and its current status."
        action={
          <Button asChild>
            <Link href="/dashboard/documents/upload">
              <Upload className="h-4 w-4" /> Upload a document
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading your documents…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon="FileText"
          title="No documents yet"
          description="Upload a property paper, contract, or any legal document to get it reviewed by a licensed lawyer."
          action={
            <Button asChild>
              <Link href="/dashboard/documents/upload">Upload your first document</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Document</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Category</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Uploaded</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/documents/${doc.id}`} className="font-medium text-ink hover:text-seal">
                      {doc.originalFileName}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{documentCategoryLabels[doc.category]}</td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{formatDate(doc.createdAt)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/documents/${doc.id}`} className="text-ink-muted hover:text-seal">
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
