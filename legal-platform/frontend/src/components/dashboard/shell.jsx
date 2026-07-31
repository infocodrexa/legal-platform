"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { cn } from "@/lib/utils";
import { Seal } from "@/components/site/seal";
import { navByRole } from "@/lib/dashboard-nav";
import { useAuth } from "@/lib/auth-context";

function NavLink({ item, onNavigate }) {
  const pathname = usePathname();
  const isActive = item.href === pathname || (item.href !== "/dashboard" && item.href !== "/lawyer" && item.href !== "/admin" && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-seal-wash text-seal" : "text-paper/70 hover:bg-paper/[0.06] hover:text-cream-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ navItems, onNavigate }) {
  return (
    <>
      <Link href="/" className="flex items-center gap-2.5 px-3 py-2">
        <svg width="26" height="26" viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
          <circle cx="15" cy="15" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-seal-soft" />
          <path d="M10 15 L13.5 18.5 L20.5 11.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="text-seal-soft" />
        </svg>
        <span className="font-display text-base font-semibold text-cream-white">
          Nyaya<span className="text-seal-soft">Setu</span>
        </span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Dashboard">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto border-t border-paper/10 pt-4">
        <Seal size={40} className="text-paper/25" />
      </div>
    </>
  );
}

export function DashboardShell({ role, user, roleLabel, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = navByRole[role] ?? navByRole.USER;
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:bg-ink lg:px-4 lg:py-6">
        <SidebarContent navItems={navItems} />
      </aside>

      {/* Mobile sidebar (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          {/* <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink px-4 py-6"> */}
          <div className="absolute inset-y-0 left-0 flex h-screen w-72 flex-col overflow-y-auto overscroll-contain bg-ink px-4 py-6">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 text-paper/60 hover:text-cream-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent navItems={navItems} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-paper-line bg-paper-raised px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-sm p-2 text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">{roleLabel}</p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-xs text-cream-white">
                {user.initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
                <p className="text-xs leading-tight text-ink-muted">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-sm p-2 text-ink-muted hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
