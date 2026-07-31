"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyLawyerProfile, useUpsertLawyerProfile } from "@/lib/hooks/useLawyerDashboard";

const profileSchema = z.object({
  barCouncilId: z.string().min(3, "Enter your Bar Council enrollment ID"),
  bio: z.string().max(2000).optional(),
  specializations: z.string().min(1, "List at least one specialization, comma-separated"),
  experienceYears: z.coerce.number().int().min(0).max(70),
  consultationCharge: z.coerce.number().positive("Enter a consultation fee"),
  licenseDoc: z.any().optional(),
  panDoc: z.any().optional(),
});

const kycMeta = {
  VERIFIED: { icon: ShieldCheck, color: "text-verified", label: "Your license has been verified. You can accept bookings." },
  PENDING: { icon: ShieldQuestion, color: "text-brass", label: "Your documents are in the queue for admin review." },
  UNDER_REVIEW: { icon: ShieldQuestion, color: "text-brass", label: "An admin is currently reviewing your submission." },
  REJECTED: { icon: ShieldAlert, color: "text-seal", label: "Your KYC was rejected. Re-upload your license below." },
};

export default function LawyerProfilePage() {
  const profileQuery = useMyLawyerProfile();
  const upsertMutation = useUpsertLawyerProfile();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const profileMissing = profileQuery.isError && profileQuery.error?.response?.status === 404;
  const profile = profileQuery.data;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          barCouncilId: profile.barCouncilId,
          bio: profile.bio || "",
          specializations: (profile.specializations || []).join(", "),
          experienceYears: profile.experienceYears,
          consultationCharge: profile.consultationCharge,
        }
      : undefined,
  });

  async function onSubmit(values) {
    setServerError("");
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("barCouncilId", values.barCouncilId);
      if (values.bio) formData.append("bio", values.bio);
      formData.append("experienceYears", values.experienceYears);
      formData.append("consultationCharge", values.consultationCharge);
      // multer collapses a single repeated field to a plain string, not a
      // 1-item array — the backend's validator now handles that (see
      // backend/src/validators/lawyer.validator.js), so appending once per
      // specialization is safe either way.
      values.specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => formData.append("specializations", s));
      if (values.licenseDoc?.[0]) formData.append("licenseDoc", values.licenseDoc[0]);
      if (values.panDoc?.[0]) formData.append("panDoc", values.panDoc[0]);

      await upsertMutation.mutateAsync(formData);
      await profileQuery.refetch();
      setSuccess(true);
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't save your profile."));
    }
  }

  if (profileQuery.isLoading) return <LoadingState label="Loading your profile…" />;
  if (profileQuery.isError && !profileMissing) {
    return <ErrorState error={profileQuery.error} onRetry={profileQuery.refetch} />;
  }

  const meta = profile ? kycMeta[profile.kycStatus] ?? kycMeta.PENDING : null;
  const Icon = meta?.icon;

  return (
    <div className="max-w-2xl space-y-8">
      <DashPageHeading title="KYC & Profile" description="Your Bar Council verification and public profile details." />

      {profile && meta && (
        <Card className="flex items-center gap-4 p-5">
          <Icon className={`h-6 w-6 shrink-0 ${meta.color}`} />
          <div>
            <p className="font-medium text-ink">{profile.kycStatus.replace("_", " ")}</p>
            <p className="text-sm text-ink-muted">{meta.label}</p>
          </div>
        </Card>
      )}
      {profileMissing && (
        <Card className="flex items-center gap-4 border-brass/40 bg-brass-wash p-5">
          <ShieldQuestion className="h-6 w-6 shrink-0 text-brass" />
          <p className="text-sm text-ink">No profile yet — fill in the form below to get started.</p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>This is what clients see when browsing the lawyer directory.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="barCouncilId">Bar Council enrollment ID</Label>
              <Input id="barCouncilId" {...register("barCouncilId")} aria-invalid={!!errors.barCouncilId} />
              {errors.barCouncilId && <p className="text-xs text-seal">{errors.barCouncilId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specializations">Specializations</Label>
              <Input id="specializations" placeholder="Family Law, Property Law" {...register("specializations")} aria-invalid={!!errors.specializations} />
              <p className="text-xs text-ink-muted">Comma-separated.</p>
              {errors.specializations && <p className="text-xs text-seal">{errors.specializations.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="experienceYears">Years of experience</Label>
                <Input id="experienceYears" type="number" {...register("experienceYears")} aria-invalid={!!errors.experienceYears} />
                {errors.experienceYears && <p className="text-xs text-seal">{errors.experienceYears.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consultationCharge">Consultation fee (₹)</Label>
                <Input id="consultationCharge" type="number" {...register("consultationCharge")} aria-invalid={!!errors.consultationCharge} />
                {errors.consultationCharge && <p className="text-xs text-seal">{errors.consultationCharge.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} {...register("bio")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="licenseDoc">License document</Label>
                <Input id="licenseDoc" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" {...register("licenseDoc")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panDoc">PAN document</Label>
                <Input id="panDoc" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" {...register("panDoc")} />
              </div>
            </div>

            {serverError && <p className="text-sm text-seal">{serverError}</p>}
            {success && <p className="text-sm text-verified">Profile saved.</p>}

            <Button type="submit" disabled={isSubmitting || upsertMutation.isPending}>
              {(isSubmitting || upsertMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
