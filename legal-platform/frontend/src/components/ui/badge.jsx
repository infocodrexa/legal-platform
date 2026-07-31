import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium font-mono tracking-wide uppercase",
  {
    variants: {
      variant: {
        seal: "bg-seal-wash text-seal",
        brass: "bg-brass-wash text-brass",
        verified: "bg-verified-wash text-verified",
        ink: "bg-ink/[0.06] text-ink",
      },
    },
    defaultVariants: {
      variant: "ink",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
