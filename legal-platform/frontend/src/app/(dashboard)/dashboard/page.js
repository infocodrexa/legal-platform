"use client";

import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { documentCategoryLabels } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useDocuments, useMyAppointments, useMyPayments } from "@/lib/hooks/useUserDashboard";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function UserDashboardOverview() {
  const { user } = useAuth();
  const documentsQuery = useDocuments({ page: 1, limit: 4 });
  const appointmentsQuery = useMyAppointments({ page: 1, limit: 20 });
  const paymentsQuery = useMyPayments({ page: 1, limit: 100 });

  if (documentsQuery.isLoading || appointmentsQuery.isLoading || paymentsQuery.isLoading) {
    return <LoadingState label="Loading your dashboard…" />;
  }
  if (documentsQuery.isError || appointmentsQuery.isError || paymentsQuery.isError) {
    return (
      <ErrorState
        error={documentsQuery.error || appointmentsQuery.error || paymentsQuery.error}
        onRetry={() => {
          documentsQuery.refetch();
          appointmentsQuery.refetch();
          paymentsQuery.refetch();
        }}
      />
    );
  }

  const documents = documentsQuery.data?.data ?? [];
  const documentsTotal = documentsQuery.data?.meta?.total ?? documents.length;
  const appointments = appointmentsQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];

  const pendingDocs = documents.filter((d) => ["PENDING", "UNDER_REVIEW", "REUPLOAD_REQUIRED"].includes(d.status));
  const upcoming = appointments.filter((a) => ["REQUESTED", "ACCEPTED"].includes(a.status));
  const totalSpent = payments
    .filter((p) => ["CAPTURED", "SETTLED"].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <DashPageHeading
        title={`Welcome back, ${user?.name?.split(" ")[0] || ""}`}
        description="Here's where things stand across your documents and consultations."
        action={
          <Button asChild>
            <Link href="/dashboard/documents/upload">
              <Upload className="h-4 w-4" /> Upload a document
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents" value={documentsTotal} icon="FileText" accent="ink" trend={`${pendingDocs.length} awaiting review`} />
        <StatCard label="Upcoming" value={upcoming.length} icon="CalendarDays" accent="seal" trend="consultations scheduled" />
        <StatCard label="Total spent" value={`₹${totalSpent.toLocaleString("en-IN")}`} icon="Wallet" accent="verified" trend="across all consultations" />
        <StatCard
          label="Next consultation"
          value={upcoming[0] ? formatDate(upcoming[0].scheduledStart) : "—"}
          icon="Clock"
          accent="brass"
          trend={upcoming[0]?.lawyerProfile?.user?.name ?? "None scheduled"}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Recent documents</h2>
            <Link href="/dashboard/documents" className="text-sm font-medium text-seal hover:underline">
              View all
            </Link>
          </div>
          {documents.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No documents uploaded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-paper-line">
              {documents.slice(0, 4).map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{doc.originalFileName}</p>
                    <p className="text-xs text-ink-muted">{documentCategoryLabels[doc.category]} · {formatDate(doc.createdAt)}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Upcoming appointments</h2>
            <Link href="/dashboard/appointments" className="text-sm font-medium text-seal hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No upcoming consultations booked.</p>
          ) : (
            <ul className="mt-4 divide-y divide-paper-line">
              {upcoming.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{appt.lawyerProfile?.user?.name || "Lawyer"}</p>
                    <p className="text-xs text-ink-muted">{formatDateTime(appt.scheduledStart)}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
            <Link href="/lawyers">
              Book a new consultation <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
