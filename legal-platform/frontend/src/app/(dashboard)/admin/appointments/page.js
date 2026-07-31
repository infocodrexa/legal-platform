// "use client";

// import { useState } from "react";
// import { DashPageHeading } from "@/components/dashboard/empty-state";
// import { StatusBadge } from "@/components/dashboard/status-badge";
// import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
// import { useAdminAppointments } from "@/lib/hooks/useAdminDashboard";

// function formatDateTime(iso) {
//   return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
// }

// const statusFilters = ["", "REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED", "REJECTED", "RESCHEDULED"];

// export default function AdminAppointmentsPage() {
//   const [statusFilter, setStatusFilter] = useState("");
//   const { data, isLoading, isError, error, refetch } = useAdminAppointments({
//     ...(statusFilter && { status: statusFilter }),
//     page: 1,
//     limit: 50,
//   });
//   const appointments = data?.data ?? [];

//   return (
//     <div>
//       <DashPageHeading title="Appointments" description="Platform-wide appointment oversight." />

//       <div className="mb-5 flex flex-wrap gap-2">
//         {statusFilters.map((s) => (
//           <button
//             key={s}
//             onClick={() => setStatusFilter(s)}
//             className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
//               statusFilter === s ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
//             }`}
//           >
//             {s || "All"}
//           </button>
//         ))}
//       </div>

//       {isLoading ? (
//         <LoadingState label="Loading appointments…" />
//       ) : isError ? (
//         <ErrorState error={error} onRetry={refetch} />
//       ) : (
//         <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
//           <table className="w-full text-left text-sm">
//             <thead>
//               <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
//                 <th className="px-5 py-3 font-medium">Client</th>
//                 <th className="px-5 py-3 font-medium">Lawyer</th>
//                 <th className="hidden px-5 py-3 font-medium sm:table-cell">Scheduled</th>
//                 <th className="hidden px-5 py-3 font-medium md:table-cell">Fee</th>
//                 <th className="px-5 py-3 font-medium">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-paper-line">
//               {appointments.map((a) => (
//                 <tr key={a.id} className="hover:bg-ink/[0.015]">
//                   <td className="px-5 py-4 font-medium text-ink">{a.user?.name}</td>
//                   <td className="px-5 py-4 text-ink-muted">{a.lawyerProfile?.user?.name}</td>
//                   <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{formatDateTime(a.scheduledStart)}</td>
//                   <td className="hidden px-5 py-4 font-mono text-ink-muted md:table-cell">₹{a.consultationCharge}</td>
//                   <td className="px-5 py-4">
//                     <StatusBadge status={a.status} />
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {appointments.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No appointments match this filter.</p>}
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  LoadingState,
  ErrorState,
} from "@/components/dashboard/query-states";
import { useAdminAppointments } from "@/lib/hooks/useAdminDashboard";
import { appointmentApi } from "@/lib/api";

function formatDateTime(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

const statusFilters = [
  "",
  "REQUESTED",
  "ACCEPTED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "RESCHEDULED",
];

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState(null);
  const [viewLoadingId, setViewLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminAppointments({
    ...(statusFilter && {
      status: statusFilter,
    }),
    page: 1,
    limit: 50,
  });

  const appointments = data?.data ?? [];

  async function handleView(appointmentId) {
    try {
      setActionError("");
      setViewLoadingId(appointmentId);

     const response = await appointmentApi.getAdmin(
  appointmentId
);

      const appointment = response?.data?.data;

      if (!appointment) {
        throw new Error(
          "Appointment details could not be loaded."
        );
      }

      setSelectedAppointment(appointment);
    } catch (viewError) {
      setActionError(getErrorMessage(viewError));
    } finally {
      setViewLoadingId(null);
    }
  }

  return (
    <div>
      <DashPageHeading
        title="Appointments"
        description="Platform-wide appointment oversight."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setActionError("");
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === status
                ? "border-ink bg-ink text-cream-white"
                : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-5 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading appointments…" />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={refetch}
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-paper-line bg-paper-raised">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">
                  Client
                </th>

                <th className="px-5 py-3 font-medium">
                  Lawyer
                </th>

                <th className="px-5 py-3 font-medium">
                  Scheduled
                </th>

                <th className="px-5 py-3 font-medium">
                  Fee
                </th>

                <th className="px-5 py-3 font-medium">
                  Status
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-paper-line">
              {appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="hover:bg-ink/[0.015]"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">
                      {appointment.user?.name ||
                        "Unknown client"}
                    </p>

                    {appointment.user?.email && (
                      <p className="mt-1 text-xs text-ink-muted">
                        {appointment.user.email}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">
                      {appointment.lawyerProfile?.user
                        ?.name || "Unknown lawyer"}
                    </p>

                    {appointment.lawyerProfile?.user
                      ?.email && (
                      <p className="mt-1 text-xs text-ink-muted">
                        {
                          appointment.lawyerProfile.user
                            .email
                        }
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-ink-muted">
                    {formatDateTime(
                      appointment.scheduledStart
                    )}
                  </td>

                  <td className="px-5 py-4 font-mono text-ink-muted">
                    {formatCurrency(
                      appointment.consultationCharge
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={appointment.status}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleView(appointment.id)
                        }
                        disabled={
                          viewLoadingId ===
                          appointment.id
                        }
                        className="rounded-md border border-paper-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {viewLoadingId ===
                        appointment.id
                          ? "Opening…"
                          : "View"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {appointments.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">
              No appointments match this filter.
            </p>
          )}
        </div>
      )}

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointment-details-title"
          onClick={() =>
            setSelectedAppointment(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-paper-line bg-paper-raised p-6 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="appointment-details-title"
                  className="text-xl font-semibold text-ink"
                >
                  Appointment details
                </h2>

                <p className="mt-1 break-all text-xs text-ink-muted">
                  ID: {selectedAppointment.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAppointment(null)
                }
                className="rounded-md border border-paper-line px-3 py-1.5 text-sm text-ink-muted transition hover:border-ink/30 hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <StatusBadge
                status={selectedAppointment.status}
              />

              <span className="text-sm font-medium text-ink">
                {formatCurrency(
                  selectedAppointment.consultationCharge
                )}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Client name"
                value={
                  selectedAppointment.user?.name
                }
              />

              <DetailItem
                label="Client email"
                value={
                  selectedAppointment.user?.email
                }
              />

              <DetailItem
                label="Client phone"
                value={
                  selectedAppointment.user?.phone
                }
              />

              <DetailItem
                label="Lawyer name"
                value={
                  selectedAppointment.lawyerProfile
                    ?.user?.name
                }
              />

              <DetailItem
                label="Lawyer email"
                value={
                  selectedAppointment.lawyerProfile
                    ?.user?.email
                }
              />

              <DetailItem
                label="Scheduled start"
                value={formatDateTime(
                  selectedAppointment.scheduledStart
                )}
              />

              <DetailItem
                label="Scheduled end"
                value={formatDateTime(
                  selectedAppointment.scheduledEnd
                )}
              />

              <DetailItem
                label="Consultation fee"
                value={formatCurrency(
                  selectedAppointment.consultationCharge
                )}
              />

              <DetailItem
                label="Consultation mode"
                value={
                  selectedAppointment.consultationMode ||
                  selectedAppointment.mode
                }
              />

              <DetailItem
                label="Created"
                value={formatDateTime(
                  selectedAppointment.createdAt
                )}
              />
            </div>

            {(selectedAppointment.subject ||
              selectedAppointment.title) && (
              <DetailSection
                label="Subject"
                value={
                  selectedAppointment.subject ||
                  selectedAppointment.title
                }
              />
            )}

            {(selectedAppointment.description ||
              selectedAppointment.notes ||
              selectedAppointment.clientNotes) && (
              <DetailSection
                label="Client notes"
                value={
                  selectedAppointment.description ||
                  selectedAppointment.notes ||
                  selectedAppointment.clientNotes
                }
              />
            )}

            {selectedAppointment.rejectionReason && (
              <DetailSection
                label="Rejection reason"
                value={
                  selectedAppointment.rejectionReason
                }
              />
            )}

            {selectedAppointment.cancellationReason && (
              <DetailSection
                label="Cancellation reason"
                value={
                  selectedAppointment.cancellationReason
                }
              />
            )}

            {selectedAppointment.meetingLink && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Meeting link
                </p>

                <a
                  href={
                    selectedAppointment.meetingLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block break-all text-sm font-medium text-blue-600 hover:underline"
                >
                  Open meeting
                </a>
              </div>
            )}

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setSelectedAppointment(null)
                }
                className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream-white transition hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-md border border-paper-line p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-ink">
        {value || "—"}
      </p>
    </div>
  );
}

function DetailSection({ label, value }) {
  return (
    <div className="mt-5 rounded-md border border-paper-line p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
        {value || "—"}
      </p>
    </div>
  );
}