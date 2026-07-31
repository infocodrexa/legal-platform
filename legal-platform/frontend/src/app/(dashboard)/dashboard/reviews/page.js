"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMyReviews, useCreateReview, useMyAppointments } from "@/lib/hooks/useUserDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star className={`h-4 w-4 ${i <= rating ? "fill-brass text-brass" : "text-paper-line"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ appointment, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const createReview = useCreateReview();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createReview.mutateAsync({ appointmentId: appointment.id, rating, comment: comment || undefined });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't submit your review."));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-paper-line pt-3">
      <Stars rating={rating} onChange={setRating} />
      <Textarea
        placeholder="How was your consultation? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
      {error && <p className="text-xs text-seal">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createReview.isPending}>
          {createReview.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Submit review
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function ReviewsPage() {
  const [openFormId, setOpenFormId] = useState(null);
  const reviewsQuery = useMyReviews({ page: 1, limit: 50 });
  const appointmentsQuery = useMyAppointments({ status: "COMPLETED", page: 1, limit: 50 });

  if (reviewsQuery.isLoading || appointmentsQuery.isLoading) return <LoadingState label="Loading your reviews…" />;
  if (reviewsQuery.isError) return <ErrorState error={reviewsQuery.error} onRetry={reviewsQuery.refetch} />;

  const reviews = reviewsQuery.data?.data ?? [];
  const completedAppointments = appointmentsQuery.data?.data ?? [];
  const reviewedAppointmentIds = new Set(reviews.map((r) => r.appointmentId));
  const pendingReviews = completedAppointments.filter((a) => !reviewedAppointmentIds.has(a.id));

  return (
    <div>
      <DashPageHeading title="Reviews" description="Reviews you've left for lawyers after a completed consultation." />

      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-brass">Awaiting your review</h2>
          <div className="mt-3 space-y-3">
            {pendingReviews.map((appt) => (
              <Card key={appt.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{appt.lawyerProfile?.user?.name || "Lawyer"}</p>
                    <p className="text-xs text-ink-muted">{formatDate(appt.scheduledStart)}</p>
                  </div>
                  {openFormId !== appt.id && (
                    <Button size="sm" variant="outline" onClick={() => setOpenFormId(appt.id)}>
                      Leave a review
                    </Button>
                  )}
                </div>
                {openFormId === appt.id && <ReviewForm appointment={appt} onDone={() => setOpenFormId(null)} />}
              </Card>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState icon="Star" title="No reviews yet" description="Reviews you leave after a completed consultation appear here." />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{r.lawyerProfile?.user?.name || "Lawyer"}</p>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink-muted">{r.comment}</p>}
              <p className="mt-3 font-mono text-xs text-ink-muted/70">{formatDate(r.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
