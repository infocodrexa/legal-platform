"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/lib/hooks/useAdminDashboard";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const roleVariant = { ADMIN: "seal", SUPER_ADMIN: "seal", LAWYER: "verified", USER: "ink" };

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const { data, isLoading, isError, error, refetch } = useAdminUsers({
    ...(debouncedSearch && { search: debouncedSearch }),
    page: 1,
    limit: 50,
  });
  const users = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Users" description={`${data?.meta?.total ?? 0} accounts across all roles.`} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input placeholder="Search by name, email, or phone" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading users…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/users/${u.id}`} className="font-medium text-ink hover:text-seal">
                      {u.name}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{u.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={roleVariant[u.role]}>{u.role}</Badge>
                  </td>
                  <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-4">
                    {u.isBanned ? <Badge variant="seal">Banned</Badge> : <Badge variant="verified">Active</Badge>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-ink-muted hover:text-seal">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No users match your search.</p>}
        </div>
      )}
    </div>
  );
}
