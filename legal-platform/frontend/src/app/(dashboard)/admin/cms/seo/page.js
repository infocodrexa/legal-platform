"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminSeoEntries, useUpsertSeoEntry, useDeleteSeoEntry } from "@/lib/hooks/useAdminDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminSeoPage() {
  const { data, isLoading, isError, error, refetch } = useAdminSeoEntries({ page: 1, limit: 100 });
  const upsertMutation = useUpsertSeoEntry();
  const deleteMutation = useDeleteSeoEntry();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ path: "", title: "", description: "" });
  const [formError, setFormError] = useState("");

  const entries = data?.data ?? [];

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("path", form.path);
      formData.append("title", form.title);
      formData.append("description", form.description);
      await upsertMutation.mutateAsync(formData);
      setForm({ path: "", title: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save this entry."));
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // no-op
    }
  }

  return (
    <div>
      <DashPageHeading
        title="SEO"
        description="Per-path metadata — title, description, canonical URL, and schema.org JSON-LD."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New entry
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="path">Path</Label>
              <Input id="path" placeholder="/services/property-law" value={form.path} onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            </div>
            {formError && <p className="text-sm text-seal">{formError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <LoadingState label="Loading SEO entries…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : entries.length === 0 ? (
        <EmptyState icon="SearchIcon" title="No entries yet" description="Add per-path metadata to control how pages appear in search." />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Path</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {entries.map((s) => (
                <tr key={s.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-mono text-xs text-ink">{s.path}</td>
                  <td className="px-5 py-4 text-ink-muted">{s.title}</td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{formatDate(s.updatedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-seal hover:bg-seal-wash" onClick={() => handleDelete(s.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
