"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Scale,
  UserRound,
} from "lucide-react";

import {
  appointmentApi,
  lawyerApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

function formatDate(dateKey) {
  if (!dateKey) return "Date not selected";

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const parsedDate = new Date(
    year,
    month - 1,
    day
  );

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatTime(isoDate) {
  if (!isoDate) return "Time unavailable";

  return new Date(isoDate).toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );
}

function getLawyerName(lawyer) {
  return (
    lawyer?.displayName ||
    lawyer?.name ||
    lawyer?.fullName ||
    lawyer?.user?.name ||
    lawyer?.user?.fullName ||
    "Selected lawyer"
  );
}

function getLawyerSpecialization(lawyer) {
  if (Array.isArray(lawyer?.specializations)) {
    return lawyer.specializations
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.name
      )
      .filter(Boolean)
      .join(" • ");
  }

  return (
    lawyer?.specialization ||
    lawyer?.primarySpecialization ||
    lawyer?.practiceArea ||
    "Legal consultation"
  );
}

function getConsultationFee(lawyer) {
  const fee =
    lawyer?.consultationCharge ??
    lawyer?.consultationFee ??
    lawyer?.fee ??
    lawyer?.price;

  if (fee === undefined || fee === null) {
    return null;
  }

  return Number(fee);
}

function getAppointmentId(response) {
  return (
    response?.data?.data?.id ||
    response?.data?.data?.appointment?.id ||
    response?.data?.appointment?.id ||
    response?.data?.id ||
    null
  );
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const lawyerProfileId =
    searchParams.get("lawyerProfileId");

  const selectedDate =
    searchParams.get("date");

  const selectedSlotId =
    searchParams.get("slotId");

  const [lawyer, setLawyer] = useState(null);
  const [slot, setSlot] = useState(null);

  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const lawyerName = useMemo(
    () => getLawyerName(lawyer),
    [lawyer]
  );

  const specialization = useMemo(
    () => getLawyerSpecialization(lawyer),
    [lawyer]
  );

  const consultationFee = useMemo(
    () => getConsultationFee(lawyer),
    [lawyer]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      const currentUrl =
        `/appointments/book` +
        `?lawyerProfileId=${encodeURIComponent(
          lawyerProfileId || ""
        )}` +
        `&date=${encodeURIComponent(
          selectedDate || ""
        )}` +
        `&slotId=${encodeURIComponent(
          selectedSlotId || ""
        )}`;

      router.replace(
        `/login?next=${encodeURIComponent(
          currentUrl
        )}`
      );
    }
  }, [
    authLoading,
    isAuthenticated,
    lawyerProfileId,
    router,
    selectedDate,
    selectedSlotId,
  ]);

  useEffect(() => {
    async function loadBookingDetails() {
      if (
        !lawyerProfileId ||
        !selectedDate ||
        !selectedSlotId
      ) {
        setPageError(
          "Booking information is incomplete. Please select the lawyer, date and time again."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError("");

      try {
        const [
          lawyerResponse,
          slotsResponse,
        ] = await Promise.all([
          lawyerApi.getPublicProfile(
            lawyerProfileId
          ),

          lawyerApi.listSlots(
            lawyerProfileId,
            {
              fromDate: selectedDate,
              toDate: selectedDate,
            }
          ),
        ]);

        const lawyerData =
          lawyerResponse?.data?.data ||
          lawyerResponse?.data ||
          null;

        const slotsData =
          slotsResponse?.data?.data;

        const slotList = Array.isArray(
          slotsData
        )
          ? slotsData
          : slotsData?.slots || [];

        const selectedSlot =
          slotList.find(
            (item) =>
              item?.id === selectedSlotId
          ) || null;

        setLawyer(lawyerData);
        setSlot(selectedSlot);

        if (!selectedSlot) {
          setPageError(
            "The selected time slot is no longer available. Please return and choose another slot."
          );
        }
      } catch (error) {
        console.error(
          "Booking details error:",
          error
        );

        setPageError(
          error?.response?.data?.message ||
            "Appointment details could not be loaded. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBookingDetails();
  }, [
    lawyerProfileId,
    selectedDate,
    selectedSlotId,
  ]);

  async function handleConfirmAppointment(
    event
  ) {
    event.preventDefault();

    if (submitting) return;

    if (!slot) {
      setFormError(
        "Selected time slot is unavailable."
      );
      return;
    }

    if (problem.trim().length < 10) {
      setFormError(
        "Please describe your legal issue in at least 10 characters."
      );
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const response =
        await appointmentApi.book({
          lawyerProfileId,
          slotId: selectedSlotId,
          problem: problem.trim(),
        });

      const appointmentId =
        getAppointmentId(response);

      if (appointmentId) {
        router.push(
          `/dashboard/appointments/${appointmentId}`
        );
        return;
      }

      router.push(
        "/dashboard/appointments"
      );
    } catch (error) {
      console.error(
        "Appointment booking error:",
        error
      );

      const validationErrors =
        error?.response?.data?.errors;

      const firstValidationError =
        Array.isArray(validationErrors)
          ? validationErrors[0]?.message
          : null;

      setFormError(
        firstValidationError ||
          error?.response?.data?.message ||
          "Appointment could not be booked. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-cream px-4 py-16">
        <div className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center rounded-xl border border-ink/10 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-seal" />

            <p className="mt-4 text-sm text-ink-muted">
              Loading appointment details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-cream px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

            <div>
              <h1 className="font-display text-2xl text-ink">
                Booking could not continue
              </h1>

              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {pageError}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Choose another slot
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-seal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to lawyer profile
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={
              handleConfirmAppointment
            }
            className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-seal/10">
                <CheckCircle2 className="h-6 w-6 text-seal" />
              </div>

              <div>
                <h1 className="font-display text-2xl text-ink sm:text-3xl">
                  Confirm your appointment
                </h1>

                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Review the appointment details
                  and briefly describe your legal
                  concern.
                </p>
              </div>
            </div>

            <section className="mt-7 rounded-lg border border-ink/10 bg-cream-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-seal/10">
                  <Scale className="h-5 w-5 text-seal" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Consultation with
                  </p>

                  <h2 className="mt-1 font-display text-xl text-ink">
                    {lawyerName}
                  </h2>

                  <p className="mt-1 text-sm text-ink-muted">
                    {specialization}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-seal" />

                <h2 className="font-display text-lg text-ink">
                  Your details
                </h2>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-ink/10 bg-cream-white p-3">
                  <p className="text-xs text-ink-muted">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-ink">
                    {user?.name ||
                      user?.fullName ||
                      "Logged-in user"}
                  </p>
                </div>

                <div className="rounded-lg border border-ink/10 bg-cream-white p-3">
                  <p className="text-xs text-ink-muted">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-ink">
                    {user?.email ||
                      "Email not available"}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs text-ink-muted">
                Appointment updates will be
                shared using your registered
                account details.
              </p>
            </section>

            <section className="mt-6">
              <label
                htmlFor="problem"
                className="block font-display text-lg text-ink"
              >
                Tell the lawyer about your
                problem
              </label>

              <p className="mt-1 text-sm text-ink-muted">
                Share a short summary so the
                lawyer can prepare before the
                consultation.
              </p>

              <textarea
                id="problem"
                name="problem"
                rows={6}
                value={problem}
                onChange={(event) => {
                  setProblem(
                    event.target.value
                  );
                  setFormError("");
                }}
                maxLength={1500}
                placeholder="Example: I need legal advice regarding a property dispute with my neighbour..."
                className="mt-3 w-full resize-none rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-seal focus:ring-2 focus:ring-seal/15"
              />

              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-ink-muted">
                  Do not share passwords, OTPs
                  or sensitive banking details.
                </span>

                <span className="shrink-0 text-ink-muted">
                  {problem.length}/1500
                </span>
              </div>
            </section>

            {formError && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                <p className="text-sm text-red-700">
                  {formError}
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking appointment...
                </>
              ) : (
                "Confirm appointment"
              )}
            </Button>

            <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
              The lawyer will review your
              request. Payment will be available
              after the appointment is accepted.
            </p>
          </form>

          <aside className="h-fit rounded-xl border border-ink/10 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-display text-xl text-ink">
              Appointment summary
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-seal" />

                <div>
                  <p className="text-xs text-ink-muted">
                    Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-ink">
                    {formatDate(selectedDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-seal" />

                <div>
                  <p className="text-xs text-ink-muted">
                    Time
                  </p>

                  <p className="mt-1 text-sm font-medium text-ink">
                    {formatTime(
                      slot?.startTime
                    )}

                    {slot?.endTime
                      ? ` – ${formatTime(
                          slot.endTime
                        )}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="my-5 border-t border-ink/10" />

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink-muted">
                Consultation fee
              </span>

              <span className="font-display text-xl text-ink">
                {consultationFee !== null
                  ? `₹${consultationFee.toLocaleString(
                      "en-IN"
                    )}`
                  : "Shown after acceptance"}
              </span>
            </div>

            <div className="mt-5 rounded-lg bg-emerald-50 p-3">
              <p className="text-xs leading-5 text-emerald-800">
                Your selected slot will be
                verified again before the
                appointment is created.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}