"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useMyLawyerProfile, useSetWorkingHours, useGenerateSlots, useMySlots,
} from "@/lib/hooks/useLawyerDashboard";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function computeInitialHours(profile) {
  if (!profile?.workingHours?.length) {
    return DAYS.map((dayOfWeek) => ({ dayOfWeek, startTime: "10:00", endTime: "18:00", isActive: !["SATURDAY", "SUNDAY"].includes(dayOfWeek) }));
  }
  return DAYS.map((dayOfWeek) => {
    const existing = profile.workingHours.find((h) => h.dayOfWeek === dayOfWeek);
    return existing
      ? { dayOfWeek, startTime: existing.startTime, endTime: existing.endTime, isActive: existing.isActive }
      : { dayOfWeek, startTime: "10:00", endTime: "18:00", isActive: false };
  });
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Keyed by profile?.id in the parent (see below) so this remounts fresh
// with the correct initial hours once the profile finishes loading —
// avoids needing an effect just to copy an async prop into local state.
function WorkingHoursCard({ profile }) {
  const [hours, setHours] = useState(() => computeInitialHours(profile));
  const [hoursError, setHoursError] = useState("");
  const [hoursSuccess, setHoursSuccess] = useState(false);
  const setWorkingHoursMutation = useSetWorkingHours();

  function updateDay(index, field, value) {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }

  async function handleSaveHours() {
    setHoursError("");
    setHoursSuccess(false);
    try {
      await setWorkingHoursMutation.mutateAsync({ workingHours: hours.filter((h) => h.isActive) });
      setHoursSuccess(true);
    } catch (err) {
      setHoursError(getErrorMessage(err, "Couldn't save your working hours."));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly hours</CardTitle>
        <CardDescription>Only active days are used when generating slots.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hours.map((h, i) => (
            <div key={h.dayOfWeek} className="flex items-center gap-3">
              <label className="flex w-32 items-center gap-2 text-sm">
                <input type="checkbox" checked={h.isActive} onChange={(e) => updateDay(i, "isActive", e.target.checked)} />
                {h.dayOfWeek[0] + h.dayOfWeek.slice(1).toLowerCase()}
              </label>
              <Input type="time" value={h.startTime} onChange={(e) => updateDay(i, "startTime", e.target.value)} disabled={!h.isActive} className="w-32" />
              <span className="text-ink-muted">to</span>
              <Input type="time" value={h.endTime} onChange={(e) => updateDay(i, "endTime", e.target.value)} disabled={!h.isActive} className="w-32" />
            </div>
          ))}
        </div>
        {hoursError && <p className="mt-4 text-sm text-seal">{hoursError}</p>}
        {hoursSuccess && <p className="mt-4 text-sm text-verified">Working hours saved.</p>}
        <Button className="mt-5" onClick={handleSaveHours} disabled={setWorkingHoursMutation.isPending}>
          {setWorkingHoursMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save working hours
        </Button>
      </CardContent>
    </Card>
  );
}

function GenerateSlotsCard({ onGenerated }) {
  const [range, setRange] = useState({ fromDate: "", toDate: "", slotDurationMinutes: 30 });
  const [generateError, setGenerateError] = useState("");
  const [generateSuccess, setGenerateSuccess] = useState("");
  const generateSlotsMutation = useGenerateSlots();

  async function handleGenerateSlots(e) {
    e.preventDefault();
    setGenerateError("");
    setGenerateSuccess("");
    try {
      const { data } = await generateSlotsMutation.mutateAsync(range);
      setGenerateSuccess(`${data.data?.created ?? "New"} slots generated.`);
      onGenerated();
    } catch (err) {
      setGenerateError(getErrorMessage(err, "Couldn't generate slots."));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate slots</CardTitle>
        <CardDescription>Turns your weekly hours into bookable slots for a specific date range.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerateSlots} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fromDate">From</Label>
              <Input id="fromDate" type="date" value={range.fromDate} onChange={(e) => setRange((r) => ({ ...r, fromDate: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toDate">To</Label>
              <Input id="toDate" type="date" value={range.toDate} onChange={(e) => setRange((r) => ({ ...r, toDate: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slotDurationMinutes">Slot length (minutes)</Label>
            <Input
              id="slotDurationMinutes"
              type="number"
              min="10"
              max="240"
              value={range.slotDurationMinutes}
              onChange={(e) => setRange((r) => ({ ...r, slotDurationMinutes: e.target.value }))}
              className="max-w-[140px]"
            />
          </div>
          {generateError && <p className="text-sm text-seal">{generateError}</p>}
          {generateSuccess && <p className="text-sm text-verified">{generateSuccess}</p>}
          <Button type="submit" disabled={generateSlotsMutation.isPending}>
            {generateSlotsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate slots
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AvailabilityPage() {
  const profileQuery = useMyLawyerProfile();
  const profile = profileQuery.data;
  const slotsQuery = useMySlots(profile?.id, { page: 1, limit: 100 });

  if (profileQuery.isLoading) return <LoadingState label="Loading your availability…" />;
  if (profileQuery.isError && profileQuery.error?.response?.status !== 404) {
    return <ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} />;
  }
  if (!profile) {
    return (
      <div>
        <DashPageHeading title="Availability" description="Set your weekly hours and generate bookable slots." />
        <p className="text-sm text-ink-muted">Set up your lawyer profile first — see KYC & Profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <DashPageHeading title="Availability" description="Set your weekly hours, then generate bookable slots for a date range." />

      <WorkingHoursCard key={profile.id} profile={profile} />
      <GenerateSlotsCard onGenerated={() => slotsQuery.refetch()} />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming open slots</CardTitle>
        </CardHeader>
        <CardContent>
          {slotsQuery.isLoading ? (
            <LoadingState label="Loading slots…" />
          ) : slotsQuery.isError ? (
            <ErrorState error={slotsQuery.error} onRetry={slotsQuery.refetch} />
          ) : (slotsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">No open slots generated yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slotsQuery.data.map((slot) => (
                <span key={slot.id} className="rounded-full border border-paper-line px-3 py-1.5 font-mono text-xs text-ink-muted">
                  {formatSlotTime(slot.startTime)}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
