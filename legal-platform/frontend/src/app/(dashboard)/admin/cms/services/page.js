"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminServices, useCreateService, useUpdateService } from "@/lib/hooks/useAdminDashboard";

export default function AdminServicesPage() {
  const { data, isLoading, isError, error, refetch } = useAdminServices({ page: 1, limit: 50 });
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", covers: "" });
  const [formError, setFormError] = useState("");

  const services = data?.data ?? [];

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      form.covers.split(",").map((s) => s.trim()).filter(Boolean).forEach((c) => formData.append("covers", c));
      await createMutation.mutateAsync(formData);
      setForm({ name: "", description: "", covers: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save this service."));
    }
  }

  async function togglePublish(s) {
    const formData = new FormData();
    formData.append("isPublished", String(!s.isPublished));
    try {
      await updateMutation.mutateAsync({ id: s.id, formData });
    } catch {
      // toggle simply won't reflect if it fails
    }
  }

  return (
    <div>
      <DashPageHeading
        title="Services"
        description="The practice-area catalog shown on the public site."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New service
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="covers">What&rsquo;s covered</Label>
              <Input id="covers" placeholder="Sale deed review, Title verification" value={form.covers} onChange={(e) => setForm((f) => ({ ...f, covers: e.target.value }))} />
              <p className="text-xs text-ink-muted">Comma-separated.</p>
            </div>
            {formError && <p className="text-sm text-seal">{formError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <LoadingState label="Loading services…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : services.length === 0 ? (
        <EmptyState icon="Briefcase" title="No services yet" description="Add your first practice area." />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Slug</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 font-medium text-ink">{s.name}</td>
                  <td className="hidden px-5 py-4 font-mono text-xs text-ink-muted sm:table-cell">/{s.slug}</td>
                  <td className="px-5 py-4">
                    {s.isPublished ? <Badge variant="verified">Published</Badge> : <Badge variant="brass">Draft</Badge>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(s)} disabled={updateMutation.isPending}>
                      {s.isPublished ? "Unpublish" : "Publish"}
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
