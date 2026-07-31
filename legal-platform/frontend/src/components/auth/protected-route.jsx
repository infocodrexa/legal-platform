"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

const roleHome = { USER: "/dashboard", LAWYER: "/lawyer", ADMIN: "/admin", SUPER_ADMIN: "/admin" };

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, status, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // wait for the initial silent-refresh attempt

    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Logged in, but wrong dashboard for their role — send them to the
      // one they actually have, rather than a bare 403 page.
      router.replace(roleHome[user.role] || "/");
    }
  }, [isLoading, status, user, allowedRoles, router, pathname]);

  if (isLoading || status === "unauthenticated" || (user && allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-seal" />
      </div>
    );
  }

  return children;
}
