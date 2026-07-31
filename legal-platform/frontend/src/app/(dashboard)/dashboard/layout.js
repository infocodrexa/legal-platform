"use client";

import { DashboardShell } from "@/components/dashboard/shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/lib/auth-context";

export default function UserDashboardLayout({ children }) {
  const { user } = useAuth();
  return (
    <ProtectedRoute allowedRoles={["USER"]}>
      <DashboardShell
        role="USER"
        user={{ name: user?.name, email: user?.email, initials: initialsOf(user?.name) }}
        roleLabel="Client Dashboard"
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}

function initialsOf(name) {
  if (!name) return "";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
