"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdminFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from "@/lib/hooks/useAdminDashboard";

export default function AdminFaqPage() {
  const { data, isLoading, isError, error, refetch } = useAdminFaqs({ page: 1, limit: 100 });
  const createMutation = useCreateFaq();
  const updateMutation = useUpdateFaq();
  const deleteMutation = useDeleteFaq();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", category: "" });
  const [formError, setFormError] = useState("");

  const faqs = data?.data ?? [];

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    try {
      await createMutation.mutateAsync(form);
      setForm({ question: "", answer: "", category: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save this question."));
    }
  }

  async function togglePublish(faq) {
    try {
      await updateMutation.mutateAsync({ id: faq.id, isPublished: !faq.isPublished });
    } catch {
      // surfaced inline per-row via Badge staying unchanged; acceptable for a toggle action
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // no-op — row simply stays if delete fails
    }
  }

  return (
    <div>
      <DashPageHeading
        title="FAQ"
        description="Questions shown on the public FAQ page, grouped by category."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New question
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="question">Question</Label>
              <Input id="question" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} required minLength={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="answer">Answer</Label>
              <Textarea id="answer" rows={3} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
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
        <LoadingState label="Loading questions…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : faqs.length === 0 ? (
        <EmptyState icon="HelpCircle" title="No questions yet" description="Add your first FAQ entry." />
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <Card key={f.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{f.question}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-muted">{f.category || "General"}</p>
              </div>
              <div className="flex items-center gap-3">
                {f.isPublished ? <Badge variant="verified">Published</Badge> : <Badge variant="brass">Draft</Badge>}
                <Button variant="ghost" size="sm" onClick={() => togglePublish(f)} disabled={updateMutation.isPending}>
                  {f.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" size="sm" className="text-seal hover:bg-seal-wash" onClick={() => handleDelete(f.id)} disabled={deleteMutation.isPending}>
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
