"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/components/dashboard/query-states";

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone number"),
  password: z.string().min(1, "Enter your password"),
});

const roleHome = { USER: "/dashboard", LAWYER: "/lawyer", ADMIN: "/admin", SUPER_ADMIN: "/admin" };

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values) {
    setServerError("");
    try {
      const user = await login(values);
      const next = searchParams.get("next");
      router.push(next || roleHome[user?.role] || "/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't log in. Check your details and try again."));
    }
  }

  return (
    <Card className="w-full max-w-sm p-2">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or phone</Label>
            <Input id="identifier" {...register("identifier")} aria-invalid={!!errors.identifier} />
            {errors.identifier && <p className="text-xs text-seal">{errors.identifier.message}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-seal hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" {...register("password")} aria-invalid={!!errors.password} />
            {errors.password && <p className="text-xs text-seal">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-seal">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Don&rsquo;t have an account?{" "}
            <Link href="/register" className="text-seal hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
