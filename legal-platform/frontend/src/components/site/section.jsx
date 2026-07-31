import { cn } from "@/lib/utils";

export function Container({ className, ...props }) {
  return <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function Section({ className, ...props }) {
  return <section className={cn("py-20 sm:py-28", className)} {...props} />;
}

export function Eyebrow({ children, className }) {
  return (
    <p className={cn("font-mono text-xs uppercase tracking-[0.2em] text-brass", className)}>
      {children}
    </p>
  );
}

// The ledger-style numbering used for genuinely sequential content (How It
// Works) — a stamped case-number, not a decorative circle-badge.
export function StepNumber({ n }) {
  return (
    <span className="inline-flex items-baseline gap-1 font-mono text-sm text-brass">
      <span className="text-xs">§</span>
      {String(n).padStart(2, "0")}
    </span>
  );
}
