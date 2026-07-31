"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Video } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyAppointments } from "@/lib/hooks/useUserDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function AppointmentsPage() {
  const { data, isLoading, isError, error, refetch } = useMyAppointments({ page: 1, limit: 50 });
  const appointments = data?.data ?? [];

  return (
    <div>
      <DashPageHeading
        title="Appointments"
        description="Every consultation you've requested or booked, past and upcoming."
        action={
          <Button asChild>
            <Link href="/lawyers">Book a consultation</Link>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading your appointments…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="CalendarDays"
          title="No appointments yet"
          description="Browse verified lawyers and book your first consultation."
          action={
            <Button asChild>
              <Link href="/lawyers">Find a lawyer</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-base text-cream-white">
                  {(appt.lawyerProfile?.user?.name || "L")[0]}
                </div>
                <div>
                  <p className="font-medium text-ink">{appt.lawyerProfile?.user?.name || "Lawyer"}</p>
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
                  <Link href={`/dashboard/appointments/${appt.id}`}>
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
