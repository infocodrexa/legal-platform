"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { mainNav } from "@/components/site/nav-data";
import { useAuth } from "@/lib/auth-context";

const roleHome = { USER: "/dashboard", LAWYER: "/lawyer", ADMIN: "/admin", SUPER_ADMIN: "/admin" };

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
        <circle cx="15" cy="15" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-seal" />
        <path
          d="M10 15 L13.5 18.5 L20.5 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-seal"
        />
      </svg>
      <span className="font-display text-lg font-semibold text-ink">
        Nyaya<span className="text-seal">Setu</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-muted hover:text-seal transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {isLoading ? null : isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={roleHome[user?.role] || "/dashboard"}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="lg:hidden rounded-sm p-2 text-ink hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="mb-8">Menu</SheetTitle>
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {mainNav.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-sm px-2 py-3 text-base font-medium text-ink hover:text-seal hover:bg-ink/5"
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-8 border-t border-paper-line">
              {isAuthenticated ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href={roleHome[user?.role] || "/dashboard"}>Dashboard</Link>
                  </Button>
                  <Button variant="primary" onClick={logout}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button variant="primary" asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
