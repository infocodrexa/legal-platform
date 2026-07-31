"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, CheckCircle2, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { documentCategoryLabels } from "@/lib/constants";
import { useVerificationDocument, useStartReview, useDecideDocument } from "@/lib/hooks/useLawyerDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function LawyerDocumentReviewPage() {
  const { id } = useParams();
  const documentQuery = useVerificationDocument(id);
  const startReviewMutation = useStartReview();
  const decideMutation = useDecideDocument();
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");

  if (documentQuery.isLoading) return <LoadingState label="Loading document…" />;
  if (documentQuery.isError) return <ErrorState error={documentQuery.error} onRetry={documentQuery.refetch} />;

  const doc = documentQuery.data;

  async function handleStartReview() {
    setActionError("");
    try {
      await startReviewMutation.mutateAsync(id);
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't start the review."));
    }
  }

  async function handleDecide(status) {
    setActionError("");
    if (status !== "VERIFIED" && !remarks.trim()) {
      setActionError("Remarks are required when rejecting or requesting a reupload.");
      return;
    }
    try {
      await decideMutation.mutateAsync({ documentId: id, status, remarks: remarks.trim() || undefined });
      setRemarks("");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't submit your decision."));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/lawyer/documents" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">{doc.originalFileName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {doc.user?.name} · {documentCategoryLabels[doc.category]} · Submitted {formatDateTime(doc.createdAt)}
          </p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <Card className="mt-6 flex items-center gap-4 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-ink/5 text-ink-muted">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{doc.originalFileName}</p>
          <p className="text-xs text-ink-muted">Signed preview link, short-lived.</p>
        </div>
        {doc.previewUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={doc.previewUrl} target="_blank" rel="noopener noreferrer">
              View document
            </a>
          </Button>
        )}
      </Card>

      {actionError && <p className="mt-4 text-sm text-seal">{actionError}</p>}

      {doc.status === "PENDING" && (
        <div className="mt-6">
          <Button onClick={handleStartReview} disabled={startReviewMutation.isPending}>
            {startReviewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Start review
          </Button>
          <p className="mt-2 text-xs text-ink-muted">Claims this document so another lawyer can&apos;t review it at the same time.</p>
        </div>
      )}

      {doc.status === "UNDER_REVIEW" && (
        <Card className="mt-6 p-6">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Required when rejecting or requesting a reupload"
            className="mt-1.5"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              className="bg-verified hover:bg-verified/90"
              onClick={() => handleDecide("VERIFIED")}
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Verify
            </Button>
            <Button variant="outline" onClick={() => handleDecide("REUPLOAD_REQUIRED")} disabled={decideMutation.isPending}>
              <RotateCcw className="h-4 w-4" /> Request reupload
            </Button>
            <Button variant="ghost" className="text-seal hover:bg-seal-wash" onClick={() => handleDecide("REJECTED")} disabled={decideMutation.isPending}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </div>
        </Card>
      )}

      {doc.remarks && (
        <Card className="mt-6 border-seal/30 bg-seal-wash p-5">
          <p className="text-sm font-medium text-seal">Your remarks</p>
          <p className="mt-1 text-sm text-ink">{doc.remarks}</p>
        </Card>
      )}
    </div>
  );
}
