"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban, LogOut, ShieldAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { useAdminUser, useBanUser, useForceLogout } from "@/lib/hooks/useAdminDashboard";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const roleVariant = { ADMIN: "seal", SUPER_ADMIN: "seal", LAWYER: "verified", USER: "ink" };

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const userQuery = useAdminUser(id);
  const banMutation = useBanUser();
  const forceLogoutMutation = useForceLogout();
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  if (userQuery.isLoading) return <LoadingState label="Loading user…" />;
  if (userQuery.isError) return <ErrorState error={userQuery.error} onRetry={userQuery.refetch} />;

  const user = userQuery.data;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  async function handleBanToggle() {
    setActionError("");
    setActionMessage("");
    try {
      await banMutation.mutateAsync({ id, isBanned: !user.isBanned });
      setActionMessage(user.isBanned ? "User unbanned." : "User banned.");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't update this user's ban status."));
    }
  }

  async function handleForceLogout() {
    setActionError("");
    setActionMessage("");
    try {
      const { data } = await forceLogoutMutation.mutateAsync(id);
      setActionMessage(data.message || "Sessions revoked.");
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn't force logout this user."));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to users
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg text-cream-white">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink">{user.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
              {user.isBanned && <Badge variant="seal">Banned</Badge>}
            </div>
          </div>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <dl className="grid grid-cols-2 gap-y-4 text-sm">
          <dt className="text-ink-muted">Email</dt>
          <dd className="text-right text-ink">{user.email}</dd>
          <dt className="text-ink-muted">Phone</dt>
          <dd className="text-right text-ink">{user.phone}</dd>
          <dt className="text-ink-muted">Verified</dt>
          <dd className="text-right text-ink">{user.isVerified ? "Yes" : "No"}</dd>
          <dt className="text-ink-muted">Documents uploaded</dt>
          <dd className="text-right text-ink">{user.documentCount}</dd>
          <dt className="text-ink-muted">Appointments</dt>
          <dd className="text-right text-ink">{user.appointmentCount}</dd>
          <dt className="text-ink-muted">Joined</dt>
          <dd className="text-right text-ink">{formatDateTime(user.createdAt)}</dd>
        </dl>
      </Card>

      {actionError && <p className="mt-4 text-sm text-seal">{actionError}</p>}
      {actionMessage && <p className="mt-4 text-sm text-verified">{actionMessage}</p>}

      {isAdmin ? (
        <Card className="mt-6 flex items-start gap-3 border-brass/30 bg-brass-wash p-5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
          <p className="text-sm text-ink">Admin accounts can&apos;t be banned or force-logged-out from this screen.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant={user.isBanned ? "outline" : "ghost"}
            className={user.isBanned ? "" : "text-seal hover:bg-seal-wash"}
            onClick={handleBanToggle}
            disabled={banMutation.isPending}
          >
            {banMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {user.isBanned ? "Unban user" : "Ban user"}
          </Button>
          <Button variant="outline" onClick={handleForceLogout} disabled={forceLogoutMutation.isPending}>
            {forceLogoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Force logout (all sessions)
          </Button>
        </div>
      )}
    </div>
  );
}
