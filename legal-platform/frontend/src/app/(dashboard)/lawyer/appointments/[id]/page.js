// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useParams } from "next/navigation";
// import { ArrowLeft, Video, MessageSquare, CheckCircle2, XCircle, Loader2 } from "lucide-react";
// import { StatusBadge } from "@/components/dashboard/status-badge";
// import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { useLawyerAppointment, useRespondToAppointment, useCompleteAppointment } from "@/lib/hooks/useLawyerDashboard";

// function formatDateTime(iso) {
//   return new Date(iso).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
// }

// export default function LawyerAppointmentDetailPage() {
//   const { id } = useParams();
//   const appointmentQuery = useLawyerAppointment(id);
//   const respondMutation = useRespondToAppointment();
//   const completeMutation = useCompleteAppointment();
//   const [actionError, setActionError] = useState("");

//   if (appointmentQuery.isLoading) return <LoadingState label="Loading appointment…" />;
//   if (appointmentQuery.isError) return <ErrorState error={appointmentQuery.error} onRetry={appointmentQuery.refetch} />;

//   const appt = appointmentQuery.data;

//   async function handleRespond(decision) {
//     setActionError("");
//     try {
//       await respondMutation.mutateAsync({ id, decision });
//     } catch (err) {
//       setActionError(getErrorMessage(err, "Couldn't respond to this request."));
//     }
//   }

//   async function handleComplete() {
//     setActionError("");
//     try {
//       await completeMutation.mutateAsync(id);
//     } catch (err) {
//       setActionError(getErrorMessage(err, "Couldn't mark this consultation complete."));
//     }
//   }

//   return (
//     <div className="max-w-2xl">
//       <Link href="/lawyer/appointments" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
//         <ArrowLeft className="h-3.5 w-3.5" /> Back to appointments
//       </Link>

//       <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div className="flex items-center gap-4">
//           <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg text-cream-white">
//             {(appt.user?.name || "C")[0]}
//           </div>
//           <div>
//             <h1 className="font-display text-2xl text-ink">{appt.user?.name || "Client"}</h1>
//             <p className="text-sm text-ink-muted">{appt.user?.email}</p>
//           </div>
//         </div>
//         <StatusBadge status={appt.status} />
//       </div>

//       <Card className="mt-6 p-6">
//         <dl className="grid grid-cols-2 gap-y-4 text-sm">
//           <dt className="text-ink-muted">Scheduled for</dt>
//           <dd className="text-right text-ink">{formatDateTime(appt.scheduledStart)}</dd>
//           <dt className="text-ink-muted">Consultation fee</dt>
//           <dd className="text-right font-mono text-ink">₹{appt.consultationCharge}</dd>
//           <dt className="text-ink-muted">Meeting link</dt>
//           <dd className="text-right text-ink">
//             {appt.googleMeetLink ? (
//               <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer" className="text-seal hover:underline">
//                 Open link
//               </a>
//             ) : (
//               "Generated on acceptance"
//             )}
//           </dd>
//         </dl>
//       </Card>

//       {actionError && <p className="mt-4 text-sm text-seal">{actionError}</p>}

//       <div className="mt-6 flex flex-wrap gap-3">
//         {appt.status === "REQUESTED" && (
//           <>
//             <Button
//               className="bg-verified hover:bg-verified/90"
//               // onClick={() => handleRespond("ACCEPT")}
//               onClick={() => handleRespond("ACCEPTED")}
//               disabled={respondMutation.isPending}
//             >
//               {respondMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
//               Accept
//             </Button>
//             <Button variant="ghost" className="text-seal hover:bg-seal-wash" onClick={() => handleRespond("REJECTED")} disabled={respondMutation.isPending}>
//               <XCircle className="h-4 w-4" /> Decline
//             </Button>
//           </>
//         )}
//         {appt.googleMeetLink && appt.status === "ACCEPTED" && (
//           <Button asChild>
//             <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer">
//               <Video className="h-4 w-4" /> Join video call
//             </a>
//           </Button>
//         )}
//         {appt.status === "ACCEPTED" && (
//           <Button variant="outline" onClick={handleComplete} disabled={completeMutation.isPending}>
//             {completeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
//             Mark as completed
//           </Button>
//         )}
//         <Button variant="outline" asChild>
//           <Link href="/lawyer/messages">
//             <MessageSquare className="h-4 w-4" /> Message client
//           </Link>
//         </Button>
//       </div>
//     </div>
//   );
// }



"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Video,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  ChevronRight,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  LoadingState,
  ErrorState,
  getErrorMessage,
} from "@/components/dashboard/query-states";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  useLawyerAppointment,
  useRespondToAppointment,
  useCompleteAppointment,
  useReviewQueue,
} from "@/lib/hooks/useLawyerDashboard";

import { documentCategoryLabels } from "@/lib/constants";

function formatDateTime(iso) {
  if (!iso) return "Not available";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso) {
  if (!iso) return "Not available";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDocumentName(document) {
  return (
    document?.originalFileName ||
    document?.fileName ||
    "Untitled document"
  );
}

export default function LawyerAppointmentDetailPage() {
  const params = useParams();
  const id = params?.id;

  const appointmentQuery =
    useLawyerAppointment(id);

  const reviewQueueQuery =
    useReviewQueue({
      page: 1,
      limit: 100,
    });

  const respondMutation =
    useRespondToAppointment();

  const completeMutation =
    useCompleteAppointment();

  const [actionError, setActionError] =
    useState("");

  const appt = appointmentQuery.data;

  const clientId =
    appt?.user?.id ||
    appt?.userId ||
    null;

  const queueDocuments = Array.isArray(
    reviewQueueQuery.data?.data
  )
    ? reviewQueueQuery.data.data
    : [];

  /*
   * Hook ko conditional return se pehle rakha gaya hai.
   * Isse React hook-order error nahi aayega.
   */
  const clientDocuments = useMemo(() => {
    if (!clientId) return [];

    return queueDocuments.filter((document) => {
      const documentClientId =
        document?.user?.id ||
        document?.userId ||
        null;

      return String(documentClientId) ===
        String(clientId);
    });
  }, [queueDocuments, clientId]);

  async function handleRespond(decision) {
    setActionError("");

    try {
      await respondMutation.mutateAsync({
        id,
        decision,
      });
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Couldn't respond to this request."
        )
      );
    }
  }

  async function handleComplete() {
    setActionError("");

    try {
      await completeMutation.mutateAsync(id);
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Couldn't mark this consultation complete."
        )
      );
    }
  }

  if (appointmentQuery.isLoading) {
    return (
      <LoadingState label="Loading appointment…" />
    );
  }

  if (appointmentQuery.isError) {
    return (
      <ErrorState
        error={appointmentQuery.error}
        onRetry={appointmentQuery.refetch}
      />
    );
  }

  if (!appt) {
    return (
      <ErrorState
        error={{
          message: "Appointment was not found.",
        }}
        onRetry={appointmentQuery.refetch}
      />
    );
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/lawyer/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-seal"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to appointments
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg text-cream-white">
            {(appt.user?.name || "C")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl text-ink">
              {appt.user?.name || "Client"}
            </h1>

            <p className="truncate text-sm text-ink-muted">
              {appt.user?.email ||
                "Email not available"}
            </p>
          </div>
        </div>

        <StatusBadge status={appt.status} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg text-ink">
          Appointment details
        </h2>

        <dl className="mt-5 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <dt className="text-ink-muted">
            Scheduled for
          </dt>

          <dd className="text-left text-ink sm:text-right">
            {formatDateTime(
              appt.scheduledStart
            )}
          </dd>

          <dt className="text-ink-muted">
            Consultation fee
          </dt>

          <dd className="text-left font-mono text-ink sm:text-right">
            ₹{appt.consultationCharge ?? 0}
          </dd>

          <dt className="text-ink-muted">
            Meeting link
          </dt>

          <dd className="text-left text-ink sm:text-right">
            {appt.googleMeetLink ? (
              <a
                href={appt.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-seal hover:underline"
              >
                Open link
              </a>
            ) : (
              "Generated on acceptance"
            )}
          </dd>
        </dl>
      </Card>

      {actionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {actionError}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {appt.status === "REQUESTED" && (
          <>
            <Button
              className="bg-verified hover:bg-verified/90"
              onClick={() =>
                handleRespond("ACCEPTED")
              }
              disabled={
                respondMutation.isPending
              }
            >
              {respondMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}

              Accept
            </Button>

            <Button
              variant="ghost"
              className="text-seal hover:bg-seal-wash"
              onClick={() =>
                handleRespond("REJECTED")
              }
              disabled={
                respondMutation.isPending
              }
            >
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
          </>
        )}

        {appt.googleMeetLink &&
          appt.status === "ACCEPTED" && (
            <Button asChild>
              <a
                href={appt.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video className="h-4 w-4" />
                Join video call
              </a>
            </Button>
          )}

        {appt.status === "ACCEPTED" && (
          <Button
            variant="outline"
            onClick={handleComplete}
            disabled={
              completeMutation.isPending
            }
          >
            {completeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            Mark as completed
          </Button>
        )}

        <Button variant="outline" asChild>
          <Link href="/lawyer/messages">
            <MessageSquare className="h-4 w-4" />
            Message client
          </Link>
        </Button>
      </div>

      <Card className="mt-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-paper-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">
              Client documents
            </h2>

            <p className="mt-1 text-sm text-ink-muted">
              Documents uploaded by{" "}
              {appt.user?.name || "this client"}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-muted">
              {clientDocuments.length}{" "}
              {clientDocuments.length === 1
                ? "document"
                : "documents"}
            </span>

            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href="/lawyer/documents">
                Open queue
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {reviewQueueQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading client documents…
          </div>
        ) : reviewQueueQuery.isError ? (
          <div className="px-5 py-8">
            <p className="text-sm text-red-700">
              {getErrorMessage(
                reviewQueueQuery.error,
                "Couldn't load client documents."
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                reviewQueueQuery.refetch()
              }
              className="mt-3 text-sm font-medium text-seal hover:underline"
            >
              Retry
            </button>
          </div>
        ) : !clientId ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <FileText className="h-8 w-8 text-ink-muted" />

            <p className="mt-3 text-sm font-medium text-ink">
              Client information unavailable
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
              This appointment response does not
              contain a client ID, so documents
              cannot be matched.
            </p>
          </div>
        ) : clientDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <FileText className="h-8 w-8 text-ink-muted" />

            <p className="mt-3 text-sm font-medium text-ink">
              No active review documents found
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-ink-muted">
              This client has no Pending or Under
              Review document in the lawyer queue.
            </p>

            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              asChild
            >
              <Link href="/lawyer/documents">
                Check document queue
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-paper-line">
            {clientDocuments.map((document) => {
              const isPending =
                document.status === "PENDING";

              return (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-ink/[0.015] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-paper">
                      <FileText className="h-5 w-5 text-ink-muted" />
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/lawyer/documents/${document.id}`}
                        className="block truncate font-medium text-ink hover:text-seal"
                      >
                        {getDocumentName(document)}
                      </Link>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                        <span>
                          {documentCategoryLabels[
                            document.category
                          ] ||
                            document.category ||
                            "Other"}
                        </span>

                        <span aria-hidden="true">
                          •
                        </span>

                        <span>
                          Submitted{" "}
                          {formatDate(
                            document.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <StatusBadge
                      status={document.status}
                    />

                    <Button
                      variant={
                        isPending
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      asChild
                    >
                      <Link
                        href={`/lawyer/documents/${document.id}`}
                      >
                        {isPending
                          ? "Review"
                          : "View"}

                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}