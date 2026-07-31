"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import { resolveIcon } from "@/components/dashboard/icon-registry";

// `icon` is a string name (e.g. "FileText"), not a component reference —
// see icon-registry.jsx for why. Rendered via createElement rather than a
// dynamic JSX tag for the same lint reason as EmptyState.
export function StatCard({ label, value, icon, accent = "ink", trend }) {
  const accentClasses = {
    ink: "bg-ink/[0.06] text-ink",
    seal: "bg-seal-wash text-seal",
    brass: "bg-brass-wash text-brass",
    verified: "bg-verified-wash text-verified",
  };

  return (
    <div className="rounded-card border border-paper-line bg-paper-raised p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">{label}</p>
        {icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", accentClasses[accent])}>
            {createElement(resolveIcon(icon), { className: "h-4 w-4" })}
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
      {trend && <p className="mt-1 text-xs text-ink-muted">{trend}</p>}
    </div>
  );
}
