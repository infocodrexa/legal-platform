import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-sm border border-ink/20 bg-cream-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70",
        "transition-colors focus-visible:outline-none focus-visible:border-seal focus-visible:ring-1 focus-visible:ring-seal",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-seal aria-invalid:ring-1 aria-invalid:ring-seal",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
