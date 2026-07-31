"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyTickets, useCreateTicket } from "@/lib/hooks/useUserDashboard";

const ticketSchema = z.object({
  subject: z.string().min(3, "Enter a short subject"),
  description: z.string().min(10, "Describe the issue in a bit more detail"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SupportPage() {
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");
  const ticketsQuery = useMyTickets({ page: 1, limit: 50 });
  const createTicket = useCreateTicket();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(ticketSchema), defaultValues: { priority: "MEDIUM" } });

  async function onSubmit(values) {
    setServerError("");
    try {
      await createTicket.mutateAsync(values);
      reset();
      setShowForm(false);
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't submit your ticket."));
    }
  }

  const tickets = ticketsQuery.data?.data ?? [];

  return (
    <div>
      <DashPageHeading
        title="Support"
        description="Open a ticket for anything the FAQ doesn't cover — we typically reply within a day."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-8 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" {...register("subject")} aria-invalid={!!errors.subject} />
              {errors.subject && <p className="text-xs text-seal">{errors.subject.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="flex h-11 w-full rounded-sm border border-ink/20 bg-cream-white px-3.5 text-sm text-ink focus-visible:outline-none focus-visible:border-seal focus-visible:ring-1 focus-visible:ring-seal"
              >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...register("description")} aria-invalid={!!errors.description} />
              {errors.description && <p className="text-xs text-seal">{errors.description.message}</p>}
            </div>
            {serverError && <p className="text-sm text-seal">{serverError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit ticket
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {ticketsQuery.isLoading ? (
        <LoadingState label="Loading your tickets…" />
      ) : ticketsQuery.isError ? (
        <ErrorState error={ticketsQuery.error} onRetry={ticketsQuery.refetch} />
      ) : tickets.length === 0 ? (
        <EmptyState icon="LifeBuoy" title="No support tickets" description="Anything you report shows up here with its status." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">{t.subject}</p>
                <p className="text-xs text-ink-muted">{formatDate(t.createdAt)} · {t.priority}</p>
              </div>
              <StatusBadge status={t.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
