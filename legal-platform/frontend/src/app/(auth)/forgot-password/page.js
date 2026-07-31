"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/components/dashboard/query-states";

const OTP_EXPIRY_SECONDS = 10 * 60;

const requestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Enter your email or phone number"),
});

const resetSchema = z
  .object({
    otp: z
      .string()
      .length(6, "Enter the 6-digit code")
      .regex(/^\d{6}$/, "Verification code must contain only numbers"),

    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[0-9]/, "Needs a number"),

    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState("request");
  const [identifier, setIdentifier] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const requestForm = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      identifier: "",
    },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const otpValue = resetForm.watch("otp");

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }, [timeLeft]);

  useEffect(() => {
    if (step !== "reset" || timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, timeLeft]);

  async function onRequestSubmit(values) {
    setServerError("");
    setSuccessMessage("");

    const cleanIdentifier = values.identifier.trim();

    try {
      await authApi.forgotPassword({
        identifier: cleanIdentifier,
      });

      setIdentifier(cleanIdentifier);
      setTimeLeft(OTP_EXPIRY_SECONDS);
      resetForm.reset();
      setStep("reset");
    } catch (error) {
      setServerError(
        getErrorMessage(
          error,
          "Couldn't send a reset code. Please try again."
        )
      );
    }
  }

  async function resendCode() {
    if (!identifier || timeLeft > 0 || isResending) {
      return;
    }

    setServerError("");
    setSuccessMessage("");
    setIsResending(true);

    try {
      await authApi.forgotPassword({
        identifier,
      });

      resetForm.resetField("otp");
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setSuccessMessage("A new verification code has been sent.");
    } catch (error) {
      setServerError(
        getErrorMessage(error, "Couldn't resend the code. Please try again.")
      );
    } finally {
      setIsResending(false);
    }
  }

  async function onResetSubmit(values) {
    setServerError("");
    setSuccessMessage("");

    if (timeLeft <= 0) {
      setServerError(
        "This verification code has expired. Please request a new code."
      );
      return;
    }

    try {
      await authApi.resetPassword({
        identifier,
        otp: values.otp,
        newPassword: values.newPassword,
      });

      setStep("done");
    } catch (error) {
      setServerError(
        getErrorMessage(
          error,
          "Invalid or expired code. Please request a new code and try again."
        )
      );
    }
  }

  function useDifferentIdentifier() {
    setStep("request");
    setIdentifier("");
    setServerError("");
    setSuccessMessage("");
    setTimeLeft(OTP_EXPIRY_SECONDS);
    resetForm.reset();
    requestForm.reset();
  }

  if (step === "done") {
    return (
      <Card className="w-full max-w-sm p-2">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-verified" />

          <h1 className="mt-4 font-display text-xl text-ink">
            Password updated
          </h1>

          <p className="mt-2 text-sm text-ink-muted">
            Your password has been changed successfully. You can now log in
            using your new password.
          </p>

          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => router.push("/login")}
          >
            Go to login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "reset") {
    const otpRegistration = resetForm.register("otp");

    return (
      <Card className="w-full max-w-sm p-2">
        <CardHeader>
          <CardTitle>Enter the verification code</CardTitle>

          <CardDescription>
            We sent a 6-digit verification code to{" "}
            <span className="break-all font-medium text-ink">
              {identifier}
            </span>
            .
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Helps password managers identify the account correctly. */}
            <input
              type="text"
              name="username"
              value={identifier}
              autoComplete="username"
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute h-0 w-0 opacity-0"
            />

            <div className="space-y-1.5">
              <Label htmlFor="resetOtp">Verification code</Label>

              <Input
                {...otpRegistration}
                id="resetOtp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={otpValue || ""}
                onChange={(event) => {
                  const numericValue = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  resetForm.setValue("otp", numericValue, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
                onPaste={(event) => {
                  event.preventDefault();

                  const numericValue = event.clipboardData
                    .getData("text")
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  resetForm.setValue("otp", numericValue, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
                aria-invalid={Boolean(
                  resetForm.formState.errors.otp
                )}
              />

              {resetForm.formState.errors.otp && (
                <p className="text-xs text-seal">
                  {resetForm.formState.errors.otp.message}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 text-xs">
                {timeLeft > 0 ? (
                  <p className="text-ink-muted">
                    Code expires in{" "}
                    <span className="font-semibold text-ink">
                      {formattedTime}
                    </span>
                  </p>
                ) : (
                  <p className="font-medium text-seal">
                    Verification code has expired
                  </p>
                )}

                <button
                  type="button"
                  onClick={resendCode}
                  disabled={timeLeft > 0 || isResending}
                  className="shrink-0 font-medium text-seal hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  {isResending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>

              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Enter a strong password"
                {...resetForm.register("newPassword")}
                aria-invalid={Boolean(
                  resetForm.formState.errors.newPassword
                )}
              />

              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-seal">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">
                Confirm new password
              </Label>

              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                {...resetForm.register("confirmPassword")}
                aria-invalid={Boolean(
                  resetForm.formState.errors.confirmPassword
                )}
              />

              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-seal">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {successMessage && (
              <p
                role="status"
                className="text-sm font-medium text-verified"
              >
                {successMessage}
              </p>
            )}

            {serverError && (
              <p role="alert" className="text-sm text-seal">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                resetForm.formState.isSubmitting ||
                timeLeft <= 0 ||
                (otpValue || "").length !== 6
              }
            >
              {resetForm.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Reset password
            </Button>

            <button
              type="button"
              onClick={useDifferentIdentifier}
              className="w-full text-center text-sm text-ink-muted hover:text-seal"
            >
              Use a different email or phone
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-2">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>

        <CardDescription>
          Enter your email or phone number and we&rsquo;ll send you a
          verification code.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={requestForm.handleSubmit(onRequestSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or phone</Label>

            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter email or phone number"
              {...requestForm.register("identifier")}
              aria-invalid={Boolean(
                requestForm.formState.errors.identifier
              )}
            />

            {requestForm.formState.errors.identifier && (
              <p className="text-xs text-seal">
                {requestForm.formState.errors.identifier.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-sm text-seal">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={requestForm.formState.isSubmitting}
          >
            {requestForm.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Send reset code
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Remembered your password?{" "}
            <Link href="/login" className="text-seal hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}