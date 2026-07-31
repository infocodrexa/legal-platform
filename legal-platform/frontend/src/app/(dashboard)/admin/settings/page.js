"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      platformCommissionPercent: 15,
      siteName: "NyayaSetu",
      supportEmail: "support@nyayasetu.example",
      reminderLeadMinutes: 30,
    },
  });

  async function onSubmit() {
    // NOTE: no live backend endpoint for platform-wide settings yet — these
    // currently live as environment variables (PLATFORM_COMMISSION_PERCENT,
    // REMINDER_LEAD_MINUTES, etc.) rather than admin-editable DB rows. This
    // form is the frontend half of closing that gap; a Settings model +
    // GET/PATCH /admin/settings endpoint is the remaining backend work.
    await new Promise((r) => setTimeout(r, 500));
  }

  return (
    <div className="max-w-2xl space-y-8">
      <DashPageHeading title="Settings" description="Platform-wide configuration." />

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Site identity and support contact.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="siteName">Site name</Label>
              <Input id="siteName" {...register("siteName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail">Support email</Label>
              <Input id="supportEmail" type="email" {...register("supportEmail")} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Commission rate applied to every consultation fee.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="platformCommissionPercent">Platform commission (%)</Label>
              <Input id="platformCommissionPercent" type="number" min="0" max="100" step="0.5" {...register("platformCommissionPercent")} className="max-w-[160px]" />
              <p className="text-xs text-ink-muted">Currently set via the backend&rsquo;s PLATFORM_COMMISSION_PERCENT environment variable.</p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>How far ahead of a consultation to send a reminder.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="reminderLeadMinutes">Lead time (minutes)</Label>
              <Input id="reminderLeadMinutes" type="number" min="5" max="1440" {...register("reminderLeadMinutes")} className="max-w-[160px]" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
