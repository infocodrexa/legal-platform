"use client";

import { useMemo, useState } from "react";
import { ImageOff, Trash2, Loader2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminMedia, useDeleteMedia } from "@/lib/hooks/useAdminDashboard";

function formatBytes(bytes) {
  if (!bytes) return "—";
  return `${(bytes / 1024).toFixed(0)} KB`;
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const contextLabels = {
  "blog-cover": "Blog cover",
  "testimonial-avatar": "Testimonial avatar",
  "seo-og-image": "SEO OG image",
  "service-cover": "Service cover",
};

export default function AdminMediaPage() {
  const [contextFilter, setContextFilter] = useState("ALL");
  const { data, isLoading, isError, error, refetch } = useAdminMedia({
    ...(contextFilter !== "ALL" && { usageContext: contextFilter }),
    page: 1,
    limit: 100,
  });
  const deleteMutation = useDeleteMedia();
  const [actionError, setActionError] = useState("");

  const media = data?.data ?? [];
  const contexts = useMemo(() => ["ALL", ...new Set((data?.data ?? []).map((m) => m.usageContext))], [data]);

  async function handleRemove(id) {
    setActionError("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't remove this asset."));
    }
  }

  return (
    <div>
      <DashPageHeading
        title="Media Library"
        description="Every marketing/CMS image uploaded across the platform. Documents and KYC files are deliberately not shown here — those stay access-controlled in their own dashboards."
      />

      {actionError && <p className="mb-4 text-sm text-seal">{actionError}</p>}

      <div className="mb-5 flex flex-wrap gap-2">
        {contexts.map((c) => (
          <button
            key={c}
            onClick={() => setContextFilter(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              contextFilter === c ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {c === "ALL" ? "All" : contextLabels[c] || c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading media…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : media.length === 0 ? (
        <EmptyState icon="Image" title="No media in this category" description="Uploads will appear here as they're added through the CMS." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((m) => (
            <Card key={m.id} className="overflow-hidden p-0">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex aspect-square items-center justify-center bg-ink/[0.04] text-ink-muted">
                <ImageOff className="h-8 w-8" />
              </a>
              <div className="p-3">
                <p className="truncate text-xs font-medium text-ink">{m.originalFileName}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">{contextLabels[m.usageContext] || m.usageContext}</p>
                <p className="mt-0.5 font-mono text-[10px] text-ink-muted/70">
                  {formatBytes(m.fileSizeBytes)} · {formatDate(m.createdAt)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-seal hover:bg-seal-wash"
                  onClick={() => handleRemove(m.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
