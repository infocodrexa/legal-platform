"use client";

import { useState } from "react";
import { DatabaseBackup, Download, RotateCcw } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminBackups, useTriggerBackup, useRequestRestore } from "@/lib/hooks/useAdminDashboard";
import { backupApi } from "@/lib/api";

function formatBytes(bytes) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";
}

export default function AdminBackupsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminBackups({ page: 1, limit: 50 });
  const triggerMutation = useTriggerBackup();
  const requestRestoreMutation = useRequestRestore();
  const [actionError, setActionError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const backups = data?.data ?? [];

  async function handleTrigger() {
    setActionError("");
    try {
      await triggerMutation.mutateAsync();
    } catch (err) {
      setActionError(getErrorMessage(err, "Backup failed to start."));
    }
  }

  async function handleDownload(id) {
    setActionError("");
    setDownloadingId(id);
    try {
      const { data: res } = await backupApi.download(id);
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't get a download link."));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRequestRestore(id) {
    setActionError("");
    try {
      const { data: res } = await requestRestoreMutation.mutateAsync({ id, reason: undefined });
      // Deliberate window.alert here: this is a rare, high-consequence
      // admin action where an inline banner would be too easy to miss.
      alert(res.message);
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't submit the restore request."));
    }
  }

  return (
    <div>
      <DashPageHeading
        title="Backups"
        description="Logical JSON export of every table, gzip-compressed, stored privately. See docs/backup-restore.md for the full restore procedure."
        action={
          <Button onClick={handleTrigger} disabled={triggerMutation.isPending}>
            <DatabaseBackup className="h-4 w-4" /> {triggerMutation.isPending ? "Backing up…" : "Run backup now"}
          </Button>
        }
      />

      {actionError && <p className="mb-4 text-sm text-seal">{actionError}</p>}

      {isLoading ? (
        <LoadingState label="Loading backups…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : backups.length === 0 ? (
        <EmptyState icon="DatabaseBackup" title="No backups yet" description="Run your first backup to see it listed here." />
      ) : (
        <div className="space-y-3">
          {backups.map((b) => (
            <Card key={b.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-ink">{b.id}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Triggered by {b.triggeredByUser?.name || "System"} · Started {formatDateTime(b.startedAt)}
                  {b.completedAt && ` · Completed ${formatDateTime(b.completedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-muted">{formatBytes(b.fileSizeBytes)}</span>
                {b.status === "COMPLETED" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(b.id)} disabled={downloadingId === b.id}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRequestRestore(b.id)} disabled={requestRestoreMutation.isPending}>
                      <RotateCcw className="h-3.5 w-3.5" /> Request restore
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
