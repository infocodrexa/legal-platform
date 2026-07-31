"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import { resolveIcon } from "@/components/dashboard/icon-registry";

// `icon` is a string name (e.g. "FileText"), not a component reference —
// see icon-registry.jsx for why. Rendered via createElement rather than a
// dynamic JSX tag (<Icon />) since the latter trips the React Compiler's
// static-components lint rule, which can't verify that resolveIcon()
// always returns a stable reference for a given key.
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-card border border-dashed border-paper-line px-6 py-16 text-center", className)}>
      {icon && createElement(resolveIcon(icon), { className: "h-8 w-8 text-ink-muted/50" })}
      <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function DashPageHeading({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
