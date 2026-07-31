"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { documentCategoryLabels } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useMyLawyerProfile, useReviewQueue, useLawyerAppointments, useLawyerEarnings } from "@/lib/hooks/useLawyerDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function LawyerDashboardOverview() {
  const { user } = useAuth();
  const profileQuery = useMyLawyerProfile();
  const queueQuery = useReviewQueue({ status: "PENDING", page: 1, limit: 4 });
  const appointmentsQuery = useLawyerAppointments({ status: "REQUESTED", page: 1, limit: 20 });
  const earningsQuery = useLawyerEarnings({ page: 1, limit: 1 });

  if (profileQuery.isLoading || queueQuery.isLoading || appointmentsQuery.isLoading || earningsQuery.isLoading) {
    return <LoadingState label="Loading your dashboard…" />;
  }

  // A 404 on the profile query means "no lawyer profile created yet" —
  // treat that as a normal state, not an error, and point to the KYC page.
  const profileMissing = profileQuery.isError && profileQuery.error?.response?.status === 404;
  if (profileQuery.isError && !profileMissing) {
    return <ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} />;
  }
  if (queueQuery.isError || appointmentsQuery.isError || earningsQuery.isError) {
    return (
      <ErrorState
        error={queueQuery.error || appointmentsQuery.error || earningsQuery.error}
        onRetry={() => {
          queueQuery.refetch();
          appointmentsQuery.refetch();
          earningsQuery.refetch();
        }}
      />
    );
  }

  const profile = profileQuery.data;
  const pendingReview = queueQuery.data?.data ?? [];
  const pendingReviewTotal = queueQuery.data?.meta?.total ?? pendingReview.length;
  const requestedAppointments = appointmentsQuery.data?.data ?? [];
  const monthPayout = earningsQuery.data?.meta?.totalEarnings ?? 0;

  return (
    <div>
      <DashPageHeading
        title={`Welcome back, ${user?.name?.split(" ").slice(-1)[0] || ""}`}
        description="Here's your queue, upcoming consultations, and earnings at a glance."
      />

      {profileMissing ? (
        <Card className="mb-8 flex items-center gap-4 border-brass/40 bg-brass-wash p-5">
          <ShieldCheck className="h-6 w-6 shrink-0 text-brass" />
          <div className="flex-1">
            <p className="font-medium text-ink">Set up your lawyer profile</p>
            <p className="text-sm text-ink-muted">You need a profile with your Bar Council ID before you can accept bookings.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/lawyer/profile">Set up now</Link>
          </Button>
        </Card>
      ) : profile?.kycStatus !== "VERIFIED" ? (
        <Card className="mb-8 flex items-center gap-4 border-brass/40 bg-brass-wash p-5">
          <ShieldCheck className="h-6 w-6 shrink-0 text-brass" />
          <div className="flex-1">
            <p className="font-medium text-ink">Your KYC is still {profile?.kycStatus?.toLowerCase().replace("_", " ")}</p>
            <p className="text-sm text-ink-muted">You can&rsquo;t accept bookings until an admin verifies your Bar Council license.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/lawyer/profile">Check status</Link>
          </Button>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Review queue" icon="FileText" accent="seal" value={pendingReviewTotal} trend="documents awaiting you" />
        <StatCard label="Requests" icon="CalendarDays" accent="brass" value={requestedAppointments.length} trend="awaiting your response" />
        <StatCard label="Total earned" icon="Wallet" accent="verified" value={`₹${Number(monthPayout).toLocaleString("en-IN")}`} trend="net payout" />
        <StatCard label="Consultation fee" icon="Receipt" accent="ink" value={profile ? `₹${profile.consultationCharge}` : "—"} trend="your current rate" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Review queue</h2>
            <Link href="/lawyer/documents" className="text-sm font-medium text-seal hover:underline">
              View all
            </Link>
          </div>
          {pendingReview.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing waiting for review.</p>
          ) : (
            <ul className="mt-4 divide-y divide-paper-line">
              {pendingReview.slice(0, 4).map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{doc.originalFileName}</p>
                    <p className="text-xs text-ink-muted">{doc.user?.name} · {documentCategoryLabels[doc.category]}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Appointment requests</h2>
            <Link href="/lawyer/appointments" className="text-sm font-medium text-seal hover:underline">
              View all
            </Link>
          </div>
          {requestedAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No pending requests.</p>
          ) : (
            <ul className="mt-4 divide-y divide-paper-line">
              {requestedAppointments.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{appt.user?.name}</p>
                    <p className="text-xs text-ink-muted">{formatDateTime(appt.scheduledStart)}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
            <Link href="/lawyer/appointments">
              Respond to requests <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
