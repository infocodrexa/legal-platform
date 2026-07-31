"use client";

import { useState } from "react";
import { Plus, Star, Loader2, Trash2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useAdminTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial,
} from "@/lib/hooks/useAdminDashboard";

export default function AdminTestimonialsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminTestimonials({ page: 1, limit: 50 });
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ authorName: "", authorRole: "", quote: "", rating: 5 });
  const [formError, setFormError] = useState("");

  const testimonials = data?.data ?? [];

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      await createMutation.mutateAsync(formData);
      setForm({ authorName: "", authorRole: "", quote: "", rating: 5 });
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save this testimonial."));
    }
  }

  async function togglePublish(t) {
    const formData = new FormData();
    formData.append("isPublished", String(!t.isPublished));
    try {
      await updateMutation.mutateAsync({ id: t.id, formData });
    } catch {
      // toggle simply won't reflect if it fails; row stays as-is
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
        title="Testimonials"
        description="Curated quotes shown on the homepage — separate from lawyer reviews."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New testimonial
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="authorName">Name</Label>
                <Input id="authorName" value={form.authorName} onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="authorRole">Role / location</Label>
                <Input id="authorRole" value={form.authorRole} onChange={(e) => setForm((f) => ({ ...f, authorRole: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quote">Quote</Label>
              <Textarea id="quote" rows={3} value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input id="rating" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} className="w-24" />
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
        <LoadingState label="Loading testimonials…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : testimonials.length === 0 ? (
        <EmptyState icon="Quote" title="No testimonials yet" description="Add your first testimonial." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i <= t.rating ? "fill-brass text-brass" : "text-paper-line"}`} />
                  ))}
                </div>
                {t.isPublished ? <Badge variant="verified">Published</Badge> : <Badge variant="brass">Draft</Badge>}
              </div>
              <p className="mt-3 text-sm font-medium text-ink">{t.authorName}</p>
              <p className="text-xs text-ink-muted">{t.authorRole}</p>
              <p className="mt-2 line-clamp-3 text-xs text-ink-muted">{t.quote}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => togglePublish(t)} disabled={updateMutation.isPending}>
                  {t.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" size="sm" className="text-seal hover:bg-seal-wash" onClick={() => handleDelete(t.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
