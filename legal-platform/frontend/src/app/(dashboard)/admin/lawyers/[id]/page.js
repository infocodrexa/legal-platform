"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminLawyer, useDecideKyc } from "@/lib/hooks/useAdminDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminLawyerDetailPage() {
  const { id } = useParams();
  const lawyerQuery = useAdminLawyer(id);
  const decideMutation = useDecideKyc();
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");

  if (lawyerQuery.isLoading) return <LoadingState label="Loading lawyer…" />;
  if (lawyerQuery.isError) return <ErrorState error={lawyerQuery.error} onRetry={lawyerQuery.refetch} />;

  const lawyer = lawyerQuery.data;
  const isDecidable = ["PENDING", "UNDER_REVIEW"].includes(lawyer.kycStatus);

  async function handleDecide(decision) {
    setActionError("");
    if (decision === "REJECTED" && !remarks.trim()) {
      setActionError("Remarks are required when rejecting.");
      return;
    }
    try {
      await decideMutation.mutateAsync({ lawyerProfileId: id, decision, remarks: remarks.trim() || undefined });
      setRemarks("");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't submit your decision."));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/lawyers" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to lawyers
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{lawyer.user?.name}</h1>
          <p className="mt-1 font-mono text-xs text-ink-muted">{lawyer.barCouncilId}</p>
        </div>
        <StatusBadge status={lawyer.kycStatus} />
      </div>

      {lawyer.kycRemarks && (
        <Card className="mt-6 border-seal/30 bg-seal-wash p-5">
          <p className="text-sm font-medium text-seal">Previous decision remarks</p>
          <p className="mt-1 text-sm text-ink">{lawyer.kycRemarks}</p>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <dl className="grid grid-cols-2 gap-y-4 text-sm">
          <dt className="text-ink-muted">Email</dt>
          <dd className="text-right text-ink">{lawyer.user?.email}</dd>
          <dt className="text-ink-muted">Phone</dt>
          <dd className="text-right text-ink">{lawyer.user?.phone}</dd>
          <dt className="text-ink-muted">Experience</dt>
          <dd className="text-right text-ink">{lawyer.experienceYears} years</dd>
          <dt className="text-ink-muted">Consultation fee</dt>
          <dd className="text-right font-mono text-ink">₹{lawyer.consultationCharge}</dd>
        </dl>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink/5 text-ink-muted">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">License document</p>
            <p className="text-xs text-ink-muted">Signed preview link, short-lived</p>
          </div>
          {lawyer.licenseDocUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={lawyer.licenseDocUrl} target="_blank" rel="noopener noreferrer">View</a>
            </Button>
          ) : (
            <span className="text-xs text-ink-muted">Not uploaded</span>
          )}
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink/5 text-ink-muted">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">PAN document</p>
            <p className="text-xs text-ink-muted">Signed preview link, short-lived</p>
          </div>
          {lawyer.panDocUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={lawyer.panDocUrl} target="_blank" rel="noopener noreferrer">View</a>
            </Button>
          ) : (
            <span className="text-xs text-ink-muted">Not uploaded</span>
          )}
        </Card>
      </div>

      {actionError && <p className="mt-4 text-sm text-seal">{actionError}</p>}

      {isDecidable && (
        <div className="mt-8 border-t border-paper-line pt-6">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea id="remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Required if rejecting" className="mt-1.5" />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="bg-verified hover:bg-verified/90" onClick={() => handleDecide("VERIFIED")} disabled={decideMutation.isPending}>
              {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve KYC
            </Button>
            <Button variant="ghost" className="text-seal hover:bg-seal-wash" onClick={() => handleDecide("REJECTED")} disabled={decideMutation.isPending}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
