"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminLead, useUpdateLead } from "@/lib/hooks/useAdminDashboard";
import { useAuth } from "@/lib/auth-context";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const statusOptions = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

export default function AdminLeadDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const leadQuery = useAdminLead(id);
  const updateMutation = useUpdateLead();
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState("");

  if (leadQuery.isLoading) return <LoadingState label="Loading lead…" />;
  if (leadQuery.isError) return <ErrorState error={leadQuery.error} onRetry={leadQuery.refetch} />;

  const lead = leadQuery.data;

  async function handleStatusChange(status) {
    setActionError("");
    try {
      await updateMutation.mutateAsync({ id, status });
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't update status."));
    }
  }

  async function handleAssignToMe() {
    setActionError("");
    try {
      await updateMutation.mutateAsync({ id, assignedToUserId: user.id });
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't assign this lead."));
    }
  }

  async function handleSaveNotes() {
    setActionError("");
    try {
      await updateMutation.mutateAsync({ id, notes });
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't save notes."));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{lead.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{lead.topic || "General question"}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-seal hover:underline">
          <Mail className="h-3.5 w-3.5" /> {lead.email}
        </a>
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-seal hover:underline">
            <Phone className="h-3.5 w-3.5" /> {lead.phone}
          </a>
        )}
      </div>

      <Card className="mt-6 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Message</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{lead.message}</p>
        <p className="mt-4 border-t border-paper-line pt-3 font-mono text-xs text-ink-muted">
          Received {formatDateTime(lead.createdAt)}
        </p>
      </Card>

      {actionError && <p className="mt-4 text-sm text-seal">{actionError}</p>}

      <div className="mt-6">
        <p className="text-sm font-medium text-ink">Update status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <Button key={s} variant={s === lead.status ? "primary" : "outline"} size="sm" onClick={() => handleStatusChange(s)} disabled={updateMutation.isPending}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink">Assigned to</p>
        <p className="mt-2 text-sm text-ink-muted">{lead.assignedToUser ? lead.assignedToUser.name : "Unassigned"}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleAssignToMe} disabled={updateMutation.isPending}>
          {lead.assignedToUser?.id === user?.id ? "Assigned to you" : "Assign to me"}
        </Button>
      </div>

      <div className="mt-6">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" rows={3} defaultValue={lead.notes || ""} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
        <Button size="sm" className="mt-2" onClick={handleSaveNotes} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save notes
        </Button>
      </div>
    </div>
  );
}
