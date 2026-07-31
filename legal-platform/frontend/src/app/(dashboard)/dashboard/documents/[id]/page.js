"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { documentCategoryLabels } from "@/lib/constants";
import { useDocument, useDocumentHistory, useDeleteDocument } from "@/lib/hooks/useUserDashboard";
import { useState } from "react";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const MUTABLE_STATUSES = new Set(["PENDING", "REJECTED", "REUPLOAD_REQUIRED"]);

export default function DocumentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [actionError, setActionError] = useState("");
  const documentQuery = useDocument(id);
  const historyQuery = useDocumentHistory(id);
  const deleteMutation = useDeleteDocument();

  if (documentQuery.isLoading) return <LoadingState label="Loading document…" />;
  if (documentQuery.isError) {
    // A 404 from the backend means this document doesn't exist or isn't yours.
    if (documentQuery.error?.response?.status === 404) {
      return <ErrorState error={documentQuery.error} title="Document not found" />;
    }
    return <ErrorState error={documentQuery.error} onRetry={documentQuery.refetch} />;
  }

  const doc = documentQuery.data;
  const isMutable = MUTABLE_STATUSES.has(doc.status);

  async function handleDelete() {
    setActionError("");
    try {
      await deleteMutation.mutateAsync(id);
      router.push("/dashboard/documents");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't delete this document."));
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/documents" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to documents
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">{doc.originalFileName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {documentCategoryLabels[doc.category]} · Uploaded {formatDateTime(doc.createdAt)}
          </p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {doc.remarks && (
        <Card className="mt-6 border-seal/30 bg-seal-wash p-5">
          <p className="text-sm font-medium text-seal">Reviewer remarks</p>
          <p className="mt-1 text-sm text-ink">{doc.remarks}</p>
        </Card>
      )}

      <Card className="mt-6 flex items-center gap-4 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-ink/5 text-ink-muted">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{doc.originalFileName}</p>
          <p className="text-xs text-ink-muted">Preview link is short-lived and signed — request it just before viewing.</p>
        </div>
        {doc.previewUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={doc.previewUrl} target="_blank" rel="noopener noreferrer">
              Preview
            </a>
          </Button>
        )}
      </Card>

      {actionError && <p className="mt-4 text-sm text-seal">{actionError}</p>}

      {isMutable && (
        <div className="mt-6 flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/documents/upload">
              <RefreshCw className="h-4 w-4" /> Replace document
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="text-seal hover:bg-seal-wash"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink">Status history</h2>
        {historyQuery.isLoading ? (
          <LoadingState label="Loading history…" />
        ) : historyQuery.isError ? (
          <ErrorState error={historyQuery.error} onRetry={historyQuery.refetch} />
        ) : (
          <ol className="mt-4 space-y-0">
            {(historyQuery.data ?? []).map((event, i, arr) => (
              <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-seal" />
                  {i < arr.length - 1 && <span className="mt-1 w-px flex-1 bg-paper-line" />}
                </div>
                <div className="-mt-1">
                  <StatusBadge status={event.toStatus} />
                  <p className="mt-1.5 text-xs text-ink-muted">{formatDateTime(event.changedAt)}</p>
                  {event.remarks && <p className="mt-1 text-sm text-ink-muted">{event.remarks}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
