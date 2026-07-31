import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-sm border border-ink/20 bg-cream-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted/70",
        "transition-colors focus-visible:outline-none focus-visible:border-seal focus-visible:ring-1 focus-visible:ring-seal",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-seal aria-invalid:ring-1 aria-invalid:ring-seal",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
