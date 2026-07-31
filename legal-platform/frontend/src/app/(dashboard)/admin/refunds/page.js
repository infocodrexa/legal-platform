"use client";

import { useState } from "react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminRefunds, useApproveRefund, useRejectRefund, useProcessRefund,
} from "@/lib/hooks/useAdminDashboard";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function RefundActions({ refund, onError }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const approveMutation = useApproveRefund();
  const rejectMutation = useRejectRefund();
  const processMutation = useProcessRefund();

  async function handleApprove() {
    onError("");
    try {
      await approveMutation.mutateAsync(refund.id);
    } catch (err) {
      onError(getErrorMessage(err, "Couldn't approve this refund."));
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      onError("A rejection reason is required.");
      return;
    }
    onError("");
    try {
      await rejectMutation.mutateAsync({ id: refund.id, rejectionReason: reason.trim() });
      setRejecting(false);
      setReason("");
    } catch (err) {
      onError(getErrorMessage(err, "Couldn't reject this refund."));
    }
  }

  async function handleProcess() {
    onError("");
    try {
      await processMutation.mutateAsync(refund.id);
    } catch (err) {
      onError(getErrorMessage(err, "Couldn't process this refund."));
    }
  }

  if (refund.status === "REQUESTED") {
    if (rejecting) {
      return (
        <div className="w-full sm:w-64">
          <Textarea rows={2} placeholder="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="ghost" className="text-seal hover:bg-seal-wash" onClick={handleReject} disabled={rejectMutation.isPending}>
              Confirm reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex gap-2">
        <Button size="sm" className="bg-verified hover:bg-verified/90" onClick={handleApprove} disabled={approveMutation.isPending}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" className="text-seal hover:bg-seal-wash" onClick={() => setRejecting(true)}>
          Reject
        </Button>
      </div>
    );
  }
  if (refund.status === "APPROVED") {
    return (
      <Button size="sm" onClick={handleProcess} disabled={processMutation.isPending}>
        Process refund
      </Button>
    );
  }
  return null;
}

export default function AdminRefundsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminRefunds({ page: 1, limit: 50 });
  const [actionError, setActionError] = useState("");
  const refunds = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Refunds" description="Requested → approved/rejected → processed, with a timestamp at every step." />

      {actionError && <p className="mb-4 text-sm text-seal">{actionError}</p>}

      {isLoading ? (
        <LoadingState label="Loading refund requests…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : refunds.length === 0 ? (
        <EmptyState icon="Wallet" title="No refund requests" description="Refund requests from clients appear here." />
      ) : (
        <div className="space-y-4">
          {refunds.map((r) => (
            <Card key={r.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{r.requestedByUser?.name}</p>
                  <StatusBadge status={r.status} />
                </div>
                {r.reason && <p className="mt-1 text-sm text-ink-muted">{r.reason}</p>}
                <p className="mt-1 font-mono text-xs text-ink-muted/70">
                  Requested {formatDate(r.requestedAt)}
                  {r.processedAt && ` · Processed ${formatDate(r.processedAt)}`}
                </p>
                {r.rejectionReason && <p className="mt-1 text-xs text-seal">Rejected: {r.rejectionReason}</p>}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-ink">₹{Number(r.amount).toLocaleString("en-IN")}</span>
                <RefundActions refund={r} onError={setActionError} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
