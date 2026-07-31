"use client";

import { Star } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Card } from "@/components/ui/card";
import { useMyLawyerProfile, useLawyerReviews } from "@/lib/hooks/useLawyerDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-brass text-brass" : "text-paper-line"}`} />
      ))}
    </div>
  );
}

export default function LawyerReviewsPage() {
  const profileQuery = useMyLawyerProfile();
  const reviewsQuery = useLawyerReviews(profileQuery.data?.id, { page: 1, limit: 50 });

  if (profileQuery.isLoading) return <LoadingState label="Loading…" />;
  if (profileQuery.isError && profileQuery.error?.response?.status !== 404) {
    return <ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} />;
  }
  if (!profileQuery.data) {
    return (
      <div>
        <DashPageHeading title="Reviews" description="What clients say after a completed consultation." />
        <p className="text-sm text-ink-muted">Set up your lawyer profile first to start receiving reviews.</p>
      </div>
    );
  }
  if (reviewsQuery.isLoading) return <LoadingState label="Loading reviews…" />;
  if (reviewsQuery.isError) return <ErrorState error={reviewsQuery.error} onRetry={reviewsQuery.refetch} />;

  const reviews = reviewsQuery.data?.data ?? [];
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div>
      <DashPageHeading
        title="Reviews"
        description={avgRating ? `Average rating ${avgRating} from ${reviews.length} review${reviews.length === 1 ? "" : "s"}.` : "What clients say after a completed consultation."}
      />

      {reviews.length === 0 ? (
        <EmptyState icon="Star" title="No reviews yet" description="Reviews from clients appear here after a completed consultation." />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{r.user?.name || "Client"}</p>
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
