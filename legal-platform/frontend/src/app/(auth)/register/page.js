// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
// import { authApi } from "@/lib/api";
// import { useAuth } from "@/lib/auth-context";
// import { getErrorMessage } from "@/components/dashboard/query-states";

// const registerSchema = z.object({
//   name: z.string().min(2, "Enter your full name"),
//   email: z.string().email("Enter a valid email address"),
//   phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
//   password: z
//     .string()
//     .min(8, "At least 8 characters")
//     .regex(/[a-z]/, "Needs a lowercase letter")
//     .regex(/[A-Z]/, "Needs an uppercase letter")
//     .regex(/[0-9]/, "Needs a number"),
// });

// const otpSchema = z.object({
//   otp: z.string().length(6, "Enter the 6-digit code"),
// });

// const roleHome = { USER: "/dashboard", LAWYER: "/lawyer", ADMIN: "/admin", SUPER_ADMIN: "/admin" };

// export default function RegisterPage() {
//   const router = useRouter();
//   const { completeRegistration } = useAuth();
//   const [step, setStep] = useState("register"); // "register" | "otp"
//   const [email, setEmail] = useState("");
//   const [serverError, setServerError] = useState("");

//   const registerForm = useForm({ resolver: zodResolver(registerSchema) });
//   const otpForm = useForm({ resolver: zodResolver(otpSchema) });

//   async function onRegister(values) {
//     setServerError("");
//     try {
//       await authApi.register(values);
//       setEmail(values.email);
//       setStep("otp");
//     } catch (err) {
//       setServerError(getErrorMessage(err));
//     }
//   }

//   async function onVerifyOtp(values) {
//     setServerError("");
//     try {
//       const user = await completeRegistration({ identifier: email, otp: values.otp });
//       router.push(roleHome[user?.role] || "/dashboard");
//     } catch (err) {
//       setServerError(getErrorMessage(err, "Invalid code. Please try again."));
//     }
//   }

//   if (step === "otp") {
//     return (
//       <Card className="w-full max-w-sm p-2">
//         <CardHeader>
//           <CardTitle>Verify your email</CardTitle>
//           <CardDescription>We sent a 6-digit code to {email}</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4" noValidate>
//             <div className="space-y-1.5">
//               <Label htmlFor="otp">Verification code</Label>
//               <Input
//                 id="otp"
//                 inputMode="numeric"
//                 maxLength={6}
//                 placeholder="000000"
//                 className="text-center font-mono text-lg tracking-[0.5em]"
//                 {...otpForm.register("otp")}
//                 aria-invalid={!!otpForm.formState.errors.otp}
//               />
//               {otpForm.formState.errors.otp && (
//                 <p className="text-xs text-seal">{otpForm.formState.errors.otp.message}</p>
//               )}
//             </div>
//             {serverError && <p className="text-sm text-seal">{serverError}</p>}
//             <Button type="submit" className="w-full" disabled={otpForm.formState.isSubmitting}>
//               {otpForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
//               Verify and continue
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="w-full max-w-sm p-2">
//       <CardHeader>
//         <CardTitle>Create your account</CardTitle>
//         <CardDescription>Free to sign up — pay only when you book a consultation.</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" noValidate>
//           <div className="space-y-1.5">
//             <Label htmlFor="name">Full name</Label>
//             <Input id="name" {...registerForm.register("name")} aria-invalid={!!registerForm.formState.errors.name} />
//             {registerForm.formState.errors.name && (
//               <p className="text-xs text-seal">{registerForm.formState.errors.name.message}</p>
//             )}
//           </div>
//           <div className="space-y-1.5">
//             <Label htmlFor="email">Email</Label>
//             <Input id="email" type="email" {...registerForm.register("email")} aria-invalid={!!registerForm.formState.errors.email} />
//             {registerForm.formState.errors.email && (
//               <p className="text-xs text-seal">{registerForm.formState.errors.email.message}</p>
//             )}
//           </div>
//           <div className="space-y-1.5">
//             <Label htmlFor="phone">Phone number</Label>
//             <Input id="phone" type="tel" {...registerForm.register("phone")} aria-invalid={!!registerForm.formState.errors.phone} />
//             {registerForm.formState.errors.phone && (
//               <p className="text-xs text-seal">{registerForm.formState.errors.phone.message}</p>
//             )}
//           </div>
//           <div className="space-y-1.5">
//             <Label htmlFor="password">Password</Label>
//             <Input id="password" type="password" {...registerForm.register("password")} aria-invalid={!!registerForm.formState.errors.password} />
//             {registerForm.formState.errors.password && (
//               <p className="text-xs text-seal">{registerForm.formState.errors.password.message}</p>
//             )}
//           </div>

//           {serverError && <p className="text-sm text-seal">{serverError}</p>}

//           <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
//             {registerForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
//             Create account
//           </Button>

//           <p className="text-center text-sm text-ink-muted">
//             Already have an account?{" "}
//             <Link href="/login" className="text-seal hover:underline">
//               Log in
//             </Link>
//           </p>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }




"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/components/dashboard/query-states";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),

  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+91)?[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian phone number"
    ),

  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

const roleHome = {
  USER: "/dashboard",
  LAWYER: "/lawyer",
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
};

export default function RegisterPage() {
  const router = useRouter();
  const { completeRegistration } = useAuth();

  const [step, setStep] = useState("register");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState("");

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onRegister(values) {
    setServerError("");

    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
      };

      await authApi.register(payload);

      setEmail(payload.email);

      // OTP input ko completely empty reset karta hai.
      otpForm.reset({
        otp: "",
      });

      setStep("otp");
    } catch (err) {
      setServerError(
        getErrorMessage(err, "Registration failed. Please try again.")
      );
    }
  }

  async function onVerifyOtp(values) {
    setServerError("");

    try {
      const user = await completeRegistration({
        identifier: email,
        otp: values.otp,
      });

      router.replace(roleHome[user?.role] || "/dashboard");
    } catch (err) {
      setServerError(
        getErrorMessage(err, "Invalid code. Please try again.")
      );
    }
  }

  function handleOtpChange(event) {
    const cleanOtp = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    otpForm.setValue("otp", cleanOtp, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: cleanOtp.length === 6,
    });
  }

  function goBackToRegistration() {
    setServerError("");

    otpForm.reset({
      otp: "",
    });

    setStep("register");
  }

  if (step === "otp") {
    return (
      <Card className="w-full max-w-sm p-2">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>

          <CardDescription>
            We sent a 6-digit verification code to{" "}
            <span className="font-medium text-ink">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={otpForm.handleSubmit(onVerifyOtp)}
            className="space-y-4"
            autoComplete="off"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="registration-verification-code">
                Verification code
              </Label>

              <Input
                id="registration-verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="000000"
                value={otpForm.watch("otp")}
                onChange={handleOtpChange}
                onBlur={() => otpForm.trigger("otp")}
                className="text-center font-mono text-lg tracking-[0.5em]"
                aria-invalid={Boolean(
                  otpForm.formState.errors.otp
                )}
                aria-describedby={
                  otpForm.formState.errors.otp
                    ? "registration-otp-error"
                    : undefined
                }
              />

              {otpForm.formState.errors.otp && (
                <p
                  id="registration-otp-error"
                  className="text-xs text-seal"
                >
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            {serverError && (
              <p
                className="text-sm text-seal"
                role="alert"
              >
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={otpForm.formState.isSubmitting}
            >
              {otpForm.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Verify and continue
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={otpForm.formState.isSubmitting}
              onClick={goBackToRegistration}
            >
              Change email
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-2">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>

        <CardDescription>
          Free to sign up — pay only when you book a consultation.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={registerForm.handleSubmit(onRegister)}
          className="space-y-4"
          autoComplete="on"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="register-name">Full name</Label>

            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              {...registerForm.register("name")}
              aria-invalid={Boolean(
                registerForm.formState.errors.name
              )}
            />

            {registerForm.formState.errors.name && (
              <p className="text-xs text-seal">
                {registerForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email">Email</Label>

            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              {...registerForm.register("email")}
              aria-invalid={Boolean(
                registerForm.formState.errors.email
              )}
            />

            {registerForm.formState.errors.email && (
              <p className="text-xs text-seal">
                {registerForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-phone">
              Phone number
            </Label>

            <Input
              id="register-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...registerForm.register("phone")}
              aria-invalid={Boolean(
                registerForm.formState.errors.phone
              )}
            />

            {registerForm.formState.errors.phone && (
              <p className="text-xs text-seal">
                {registerForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password">
              Password
            </Label>

            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              {...registerForm.register("password")}
              aria-invalid={Boolean(
                registerForm.formState.errors.password
              )}
            />

            {registerForm.formState.errors.password && (
              <p className="text-xs text-seal">
                {registerForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p
              className="text-sm text-seal"
              role="alert"
            >
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={registerForm.formState.isSubmitting}
          >
            {registerForm.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Create account
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-seal hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}