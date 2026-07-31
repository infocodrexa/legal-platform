"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useUpdateProfile } from "@/lib/hooks/useUserDashboard";
import { authApi } from "@/lib/api";
import { AccountSecuritySettings } from "@/components/dashboard/account-security-settings";

const profileSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
});

// The backend has no "change password while logged in with current
// password" endpoint — only the OTP-based forgot/reset-password flow (see
// backend/src/routes/auth.routes.js). Rather than invent a new backend
// endpoint, this form uses that real flow: request an OTP, then submit it
// with the new password.
const passwordSchema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit code"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[0-9]/, "Needs a number"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function SettingsPage() {
  const { user, refetchUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpRequesting, setOtpRequesting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const profileForm = useForm({ resolver: zodResolver(profileSchema), values: user || undefined });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  async function onProfileSubmit(values) {
    setProfileError("");
    setProfileSuccess(false);
    try {
      await updateProfile.mutateAsync(values);
      await refetchUser();
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(getErrorMessage(err, "Couldn't update your profile."));
    }
  }

  async function requestPasswordOtp() {
    setOtpRequesting(true);
    setPasswordError("");
    try {
      await authApi.forgotPassword({ identifier: user.email });
      setOtpSent(true);
    } catch (err) {
      setPasswordError(getErrorMessage(err, "Couldn't send a verification code."));
    } finally {
      setOtpRequesting(false);
    }
  }

  async function onPasswordSubmit(values) {
    setPasswordError("");
    setPasswordSuccess(false);
    try {
      await authApi.resetPassword({ identifier: user.email, otp: values.otp, newPassword: values.newPassword });
      passwordForm.reset();
      setOtpSent(false);
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(getErrorMessage(err, "Couldn't update your password."));
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <DashPageHeading title="Settings" description="Manage your account details and password." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name, email, and phone number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...profileForm.register("name")} aria-invalid={!!profileForm.formState.errors.name} />
              {profileForm.formState.errors.name && <p className="text-xs text-seal">{profileForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...profileForm.register("email")} aria-invalid={!!profileForm.formState.errors.email} />
              {profileForm.formState.errors.email && <p className="text-xs text-seal">{profileForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...profileForm.register("phone")} aria-invalid={!!profileForm.formState.errors.phone} />
              {profileForm.formState.errors.phone && <p className="text-xs text-seal">{profileForm.formState.errors.phone.message}</p>}
            </div>
            {profileError && <p className="text-sm text-seal">{profileError}</p>}
            {profileSuccess && (
              <p className="flex items-center gap-1.5 text-sm text-verified">
                <CheckCircle2 className="h-4 w-4" /> Profile updated.
              </p>
            )}
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {otpSent ? `Enter the code sent to ${user?.email} along with your new password.` : "We'll email you a verification code to confirm the change."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <Button variant="outline" onClick={requestPasswordOtp} disabled={otpRequesting}>
              {otpRequesting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send verification code
            </Button>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="otp">Verification code</Label>
                <Input id="otp" inputMode="numeric" maxLength={6} {...passwordForm.register("otp")} aria-invalid={!!passwordForm.formState.errors.otp} />
                {passwordForm.formState.errors.otp && <p className="text-xs text-seal">{passwordForm.formState.errors.otp.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} aria-invalid={!!passwordForm.formState.errors.newPassword} />
                {passwordForm.formState.errors.newPassword && <p className="text-xs text-seal">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} aria-invalid={!!passwordForm.formState.errors.confirmPassword} />
                {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-seal">{passwordForm.formState.errors.confirmPassword.message}</p>}
              </div>
              {passwordError && <p className="text-sm text-seal">{passwordError}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </Button>
                <Button type="button" variant="outline" onClick={() => setOtpSent(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
          {passwordSuccess && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-verified">
              <CheckCircle2 className="h-4 w-4" /> Password updated. You&rsquo;ll need to log in again on other devices.
            </p>
          )}
        </CardContent>
      </Card>

      <AccountSecuritySettings />
    </div>
  );
}
