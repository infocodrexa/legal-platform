"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { lawyerApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const STATUS = {
  AVAILABLE: "AVAILABLE",
  FULLY_BOOKED: "FULLY_BOOKED",
  UNAVAILABLE: "UNAVAILABLE",
};

function padNumber(value) {
  return String(value).padStart(2, "0");
}

/**
 * Local date ko YYYY-MM-DD format me convert karta hai.
 * Local date components use kiye gaye hain taaki timezone ke
 * kaaran date ek din aage ya peeche na ho.
 */
function toDateKey(date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function parseDateKey(dateKey) {
  if (!dateKey) return null;

  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function endOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date, months) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1
  );
}

function isSameMonth(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}

function isSameDate(firstDate, secondDate) {
  return toDateKey(firstDate) === toDateKey(secondDate);
}

function formatMonthTitle(date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatSelectedDate(dateKey) {
  const parsedDate = parseDateKey(dateKey);

  if (!parsedDate) return "";

  return parsedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(isoDate) {
  if (!isoDate) return "";

  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getCalendarDays(monthDate) {
  const firstDate = startOfMonth(monthDate);
  const lastDate = endOfMonth(monthDate);

  const gridStart = addDays(
    firstDate,
    -firstDate.getDay()
  );

  const gridEnd = addDays(
    lastDate,
    6 - lastDate.getDay()
  );

  const days = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getDateButtonClasses({
  isCurrentMonth,
  isSelected,
  isPast,
  isOutsideBookingRange,
  status,
}) {
  const baseClasses =
    "relative flex aspect-square w-full items-center justify-center rounded-md border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-seal/40";

  if (!isCurrentMonth) {
    return `${baseClasses} cursor-default border-transparent text-ink-muted/30`;
  }

  if (isPast || isOutsideBookingRange) {
    return `${baseClasses} cursor-not-allowed border-ink/5 bg-ink/[0.03] text-ink-muted/35`;
  }

  if (isSelected) {
    return `${baseClasses} border-seal bg-seal text-white shadow-sm ring-2 ring-seal/20`;
  }

  if (status === STATUS.AVAILABLE) {
    return `${baseClasses} border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100`;
  }

  if (status === STATUS.FULLY_BOOKED) {
    return `${baseClasses} cursor-not-allowed border-red-200 bg-red-50 text-red-700`;
  }

  return `${baseClasses} cursor-not-allowed border-ink/10 bg-ink/[0.04] text-ink-muted`;
}

export default function AppointmentCalendar({
  lawyerProfileId,
  consultationCharge,
}) {
  const router = useRouter();

  const {
    user,
    status,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const today = useMemo(() => {
    const currentDate = new Date();

    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
  }, []);

  /**
   * User maximum next 60 days tak appointment
   * select kar sakta hai.
   */
  const maximumBookingDate = useMemo(
    () => addDays(today, 59),
    [today]
  );

  const [visibleMonth, setVisibleMonth] = useState(
    startOfMonth(today)
  );

  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] =
    useState("");

  const [calendarLoading, setCalendarLoading] =
    useState(true);

  const [slotsLoading, setSlotsLoading] =
    useState(false);

  const [bookingRedirectLoading, setBookingRedirectLoading] =
    useState(false);

  const [calendarError, setCalendarError] =
    useState("");

  const [slotsError, setSlotsError] =
    useState("");

  const [bookingError, setBookingError] =
    useState("");

  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const selectedSlot = useMemo(
    () =>
      slots.find(
        (slot) => slot.id === selectedSlotId
      ) || null,
    [slots, selectedSlotId]
  );

  const canGoToPreviousMonth = useMemo(() => {
    return visibleMonth > startOfMonth(today);
  }, [today, visibleMonth]);

  const canGoToNextMonth = useMemo(() => {
    const nextMonth = addMonths(visibleMonth, 1);

    return (
      nextMonth <=
      startOfMonth(maximumBookingDate)
    );
  }, [maximumBookingDate, visibleMonth]);

  function clearDateAndSlotSelection() {
    setSelectedDate("");
    setSlots([]);
    setSelectedSlotId("");
    setSlotsError("");
    setBookingError("");
  }

  const fetchCalendar = useCallback(async () => {
    if (!lawyerProfileId) {
      setCalendarLoading(false);
      setCalendarError(
        "Lawyer profile information is missing."
      );
      return;
    }

    setCalendarLoading(true);
    setCalendarError("");

    try {
      const monthStart =
        startOfMonth(visibleMonth);

      const monthEnd =
        endOfMonth(visibleMonth);

      const fromDate =
        monthStart < today
          ? toDateKey(today)
          : toDateKey(monthStart);

      const toDate =
        monthEnd > maximumBookingDate
          ? toDateKey(maximumBookingDate)
          : toDateKey(monthEnd);

      const response =
        await lawyerApi.availabilityCalendar(
          lawyerProfileId,
          {
            fromDate,
            toDate,
          }
        );

      const responseData =
        response?.data?.data;

      const dates = Array.isArray(responseData)
        ? responseData
        : responseData?.dates || [];

      const mappedDates = {};

      dates.forEach((item) => {
        if (!item?.date) return;

        mappedDates[item.date] = {
          date: item.date,

          status:
            item.status ||
            STATUS.UNAVAILABLE,

          availableCount: Number(
            item.availableCount || 0
          ),

          bookedCount: Number(
            item.bookedCount || 0
          ),

          totalCount: Number(
            item.totalCount || 0
          ),
        };
      });

      setCalendarData(mappedDates);
    } catch (error) {
      console.error(
        "Availability calendar error:",
        error
      );

      setCalendarData({});

      setCalendarError(
        error?.response?.data?.message ||
          "Calendar availability load nahi ho paayi."
      );
    } finally {
      setCalendarLoading(false);
    }
  }, [
    lawyerProfileId,
    maximumBookingDate,
    today,
    visibleMonth,
  ]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const fetchSlots = useCallback(
    async (dateKey) => {
      if (!lawyerProfileId || !dateKey) {
        return;
      }

      setSlotsLoading(true);
      setSlotsError("");
      setBookingError("");
      setSlots([]);
      setSelectedSlotId("");

      try {
        const response =
          await lawyerApi.listSlots(
            lawyerProfileId,
            {
              fromDate: dateKey,
              toDate: dateKey,
            }
          );

        const responseData =
          response?.data?.data;

        const returnedSlots = Array.isArray(
          responseData
        )
          ? responseData
          : responseData?.slots || [];

        /**
         * Backend ideally sirf available slots return kare.
         * Safety ke liye unavailable/booked slots ko filter
         * kar rahe hain, agar status response me present ho.
         */
        const availableSlots =
          returnedSlots.filter((slot) => {
            if (!slot) return false;

            if (!slot.status) return true;

            return (
              slot.status === "AVAILABLE" ||
              slot.status === "OPEN"
            );
          });

        setSlots(availableSlots);
      } catch (error) {
        console.error(
          "Slots loading error:",
          error
        );

        setSlots([]);

        setSlotsError(
          error?.response?.data?.message ||
            "Is date ke slots load nahi ho paaye."
        );
      } finally {
        setSlotsLoading(false);
      }
    },
    [lawyerProfileId]
  );

  function handleDateSelect(date) {
    const dateKey = toDateKey(date);
    const dateInformation =
      calendarData[dateKey];

    if (
      date < today ||
      date > maximumBookingDate ||
      dateInformation?.status !==
        STATUS.AVAILABLE
    ) {
      return;
    }

    if (
      selectedDate === dateKey &&
      slots.length > 0
    ) {
      return;
    }

    setSelectedDate(dateKey);
    setBookingError("");
    fetchSlots(dateKey);
  }

  function handlePreviousMonth() {
    if (
      !canGoToPreviousMonth ||
      calendarLoading
    ) {
      return;
    }

    clearDateAndSlotSelection();

    setVisibleMonth((currentMonth) =>
      addMonths(currentMonth, -1)
    );
  }

  function handleNextMonth() {
    if (
      !canGoToNextMonth ||
      calendarLoading
    ) {
      return;
    }

    clearDateAndSlotSelection();

    setVisibleMonth((currentMonth) =>
      addMonths(currentMonth, 1)
    );
  }

  function handleSlotSelect(slotId) {
    if (!slotId || slotsLoading) return;

    setSelectedSlotId(slotId);
    setBookingError("");
  }

  function handleContinueBooking() {
    if (
      bookingRedirectLoading ||
      isLoading
    ) {
      return;
    }

    if (!selectedDate) {
      setBookingError(
        "Please select an appointment date."
      );
      return;
    }

    if (!selectedSlot) {
      setBookingError(
        "Please select an appointment time."
      );
      return;
    }

    if (!lawyerProfileId) {
      setBookingError(
        "Lawyer profile information is missing."
      );
      return;
    }

    setBookingError("");
    setBookingRedirectLoading(true);

    /**
     * Final booking page URL.
     *
     * Agar tumhare project me booking page ka route alag hai,
     * to sirf "/appointments/book" ko change karna hai.
     */
  const bookingUrl =
  `/appointments/book` +
  `?lawyerProfileId=${encodeURIComponent(lawyerProfileId)}` +
  `&date=${encodeURIComponent(selectedDate)}` +
  `&slotId=${encodeURIComponent(selectedSlot.id)}`;

    /**
     * Auth check abhi loading me hai to redirect nahi karna.
     */
    if (status === "loading") {
      setBookingRedirectLoading(false);
      return;
    }

    /**
     * Guest user ko register par direct nahi bhejna.
     * Pehle login page par bhejna hai.
     *
     * Login successful hone ke baad bookingUrl par
     * wapas redirect hoga.
     */
   if (!isAuthenticated) {
  router.push(
    `/login?next=${encodeURIComponent(bookingUrl)}`
  );
  return;
}

    /**
     * Logged-in user ko direct booking page par bhejna hai.
     *
     * Role restriction yahan hardcode nahi ki gayi,
     * kyunki project me role CLIENT, USER, CUSTOMER
     * ya kisi aur naam se ho sakta hai.
     *
     * Booking API/backend authorization ko final role
     * validation karni chahiye.
     */
    console.log("Booking user:", user);
    console.log("Selected booking:", {
      lawyerProfileId,
      selectedDate,
      selectedSlotId: selectedSlot.id,
    });

    router.push(bookingUrl);
  }

  const continueButtonDisabled =
    isLoading ||
    slotsLoading ||
    bookingRedirectLoading ||
    !selectedDate ||
    !selectedSlot;

  return (
    <div className="mt-6">
      <div className="rounded-lg border border-ink/10 bg-cream-white p-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            disabled={
              !canGoToPreviousMonth ||
              calendarLoading
            }
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="flex items-center justify-center gap-2 font-display text-lg text-ink">
              <CalendarDays className="h-5 w-5 text-seal" />

              {formatMonthTitle(
                visibleMonth
              )}
            </p>

            <p className="mt-0.5 text-xs text-ink-muted">
              Select an available date
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={
              !canGoToNextMonth ||
              calendarLoading
            }
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Available
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            Fully booked
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
            Unavailable
          </span>
        </div>

        {calendarError ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700">
              {calendarError}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={fetchCalendar}
              disabled={calendarLoading}
            >
              {calendarLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}

              Try again
            </Button>
          </div>
        ) : (
          <>
            {/* Week headings */}
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center font-mono text-[10px] uppercase tracking-wide text-ink-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="mt-1 grid grid-cols-7 gap-1.5">
              {calendarDays.map((date) => {
                const dateKey =
                  toDateKey(date);

                const dateInformation =
                  calendarData[dateKey];

                const currentMonth =
                  isSameMonth(
                    date,
                    visibleMonth
                  );

                const selectedDateObject =
                  parseDateKey(selectedDate);

                const selected =
                  Boolean(
                    selectedDateObject
                  ) &&
                  isSameDate(
                    date,
                    selectedDateObject
                  );

                const pastDate =
                  date < today;

                const outsideBookingRange =
                  date >
                  maximumBookingDate;

                const dateStatus =
                  dateInformation?.status ||
                  STATUS.UNAVAILABLE;

                const disabled =
                  calendarLoading ||
                  !currentMonth ||
                  pastDate ||
                  outsideBookingRange ||
                  dateStatus !==
                    STATUS.AVAILABLE;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      handleDateSelect(date)
                    }
                    className={getDateButtonClasses(
                      {
                        isCurrentMonth:
                          currentMonth,

                        isSelected:
                          selected,

                        isPast:
                          pastDate,

                        isOutsideBookingRange:
                          outsideBookingRange,

                        status:
                          dateStatus,
                      }
                    )}
                    title={
                      currentMonth
                        ? dateStatus ===
                          STATUS.AVAILABLE
                          ? `${
                              dateInformation?.availableCount ||
                              0
                            } slot(s) available`
                          : dateStatus ===
                              STATUS.FULLY_BOOKED
                            ? "Fully booked"
                            : "Lawyer unavailable"
                        : undefined
                    }
                  >
                    {date.getDate()}

                    {currentMonth &&
                      !pastDate &&
                      !outsideBookingRange &&
                      !selected && (
                        <span
                          className={[
                            "absolute bottom-1 h-1.5 w-1.5 rounded-full",

                            dateStatus ===
                            STATUS.AVAILABLE
                              ? "bg-emerald-500"
                              : dateStatus ===
                                  STATUS.FULLY_BOOKED
                                ? "bg-red-500"
                                : "bg-ink/25",
                          ].join(" ")}
                        />
                      )}
                  </button>
                );
              })}
            </div>

            {calendarLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading availability...
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected date slots */}
      {selectedDate && (
        <div className="mt-5 rounded-lg border border-ink/10 bg-cream-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg text-ink">
                Available time slots
              </p>

              <p className="mt-1 text-xs text-ink-muted">
                {formatSelectedDate(
                  selectedDate
                )}
              </p>
            </div>

            <Clock className="mt-1 h-5 w-5 shrink-0 text-seal" />
          </div>

          {slotsLoading ? (
            <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading slots...
            </div>
          ) : slotsError ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                {slotsError}
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  fetchSlots(selectedDate)
                }
                disabled={slotsLoading}
              >
                {slotsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}

                Retry
              </Button>
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-4 rounded-md bg-ink/[0.04] p-3 text-sm text-ink-muted">
              Is date ke liye koi open slot
              available nahi hai.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const selected =
                  selectedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() =>
                      handleSlotSelect(slot.id)
                    }
                    aria-pressed={selected}
                    className={[
                      "rounded-md border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-seal/30",

                      selected
                        ? "border-seal bg-seal text-white shadow-sm"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100",
                    ].join(" ")}
                  >
                    {formatTime(
                      slot.startTime
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking summary */}
      {selectedDate && selectedSlot && (
        <div className="mt-5 rounded-lg border border-seal/20 bg-seal/[0.04] p-4">
          <p className="font-display text-lg text-ink">
            Booking summary
          </p>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-ink-muted">
                Date
              </span>

              <span className="text-right font-medium text-ink">
                {formatSelectedDate(
                  selectedDate
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-ink-muted">
                Time
              </span>

              <span className="font-medium text-ink">
                {formatTime(
                  selectedSlot.startTime
                )}
              </span>
            </div>

            {selectedSlot.endTime && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-ink-muted">
                  Ends at
                </span>

                <span className="font-medium text-ink">
                  {formatTime(
                    selectedSlot.endTime
                  )}
                </span>
              </div>
            )}

            {consultationCharge !==
              undefined &&
              consultationCharge !==
                null && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-muted">
                    Consultation fee
                  </span>

                  <span className="font-medium text-ink">
                    ₹
                    {Number(
                      consultationCharge
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}
          </div>

          {bookingError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                {bookingError}
              </p>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            onClick={handleContinueBooking}
            disabled={
              continueButtonDisabled
            }
          >
            {isLoading ||
            bookingRedirectLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                {isLoading
                  ? "Checking account..."
                  : "Opening booking..."}
              </>
            ) : (
              "Continue to book"
            )}
          </Button>

          <p className="mt-2 text-center text-xs text-ink-muted">
            {isLoading
              ? "Checking your account..."
              : isAuthenticated
                ? "Continue to review and confirm your appointment."
                : "Please sign in to confirm your appointment."}
          </p>
        </div>
      )}
    </div>
  );
}