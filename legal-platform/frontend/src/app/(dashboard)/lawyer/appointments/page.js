"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Video } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLawyerAppointments } from "@/lib/hooks/useLawyerDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const statusFilters = [
  { label: "All", value: "" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Completed", value: "COMPLETED" },
];

export default function LawyerAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError, error, refetch } = useLawyerAppointments({
    ...(statusFilter && { status: statusFilter }),
    page: 1,
    limit: 50,
  });
  const appointments = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Appointments" description="Consultation requests and bookings from clients." />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.value ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading appointments…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : appointments.length === 0 ? (
        <EmptyState icon="CalendarDays" title="No appointments" description="Requests and bookings from clients will show up here." />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-base text-cream-white">
                  {(appt.user?.name || "C")[0]}
                </div>
                <div>
                  <p className="font-medium text-ink">{appt.user?.name || "Client"}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(appt.scheduledStart)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                <StatusBadge status={appt.status} />
                <span className="font-mono text-xs text-ink-muted">₹{appt.consultationCharge}</span>
              </div>
              <div className="flex gap-2 sm:ml-4">
                {appt.googleMeetLink && appt.status === "ACCEPTED" && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer">
                      <Video className="h-3.5 w-3.5" /> Join
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/lawyer/appointments/${appt.id}`}>
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
