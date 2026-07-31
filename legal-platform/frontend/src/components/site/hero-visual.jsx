"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Seal } from "@/components/site/seal";

export function HeroVisual() {
  const shouldReduceMotion = useReducedMotion();

  const sealAnimation = shouldReduceMotion
    ? { opacity: 1, scale: 1, rotate: -12 }
    : {
        initial: { opacity: 0, scale: 1.6, rotate: 8, y: -30 },
        animate: { opacity: 1, scale: 1, rotate: -12, y: 0 },
        transition: { duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* The document card */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-card border border-paper-line bg-cream-white p-7 shadow-[0_1px_2px_rgba(22,35,63,0.06),0_12px_32px_-16px_rgba(22,35,63,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-paper-line pb-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Document · Sale Deed
          </span>
          <span className="font-mono text-[11px] text-ink-muted">#DOC-2201</span>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="h-2.5 w-4/5 rounded-full bg-ink/10" />
          <div className="h-2.5 w-full rounded-full bg-ink/10" />
          <div className="h-2.5 w-full rounded-full bg-ink/10" />
          <div className="h-2.5 w-3/5 rounded-full bg-ink/10" />
        </div>

        <div className="mt-6 space-y-2.5">
          <div className="h-2.5 w-full rounded-full bg-ink/10" />
          <div className="h-2.5 w-4/6 rounded-full bg-ink/10" />
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-paper-line pt-4">
          <span className="font-mono text-[11px] text-verified">STATUS: VERIFIED</span>
          <span className="h-2 w-2 rounded-full bg-verified" />
        </div>
      </motion.div>

      {/* The seal, stamped on top */}
      <motion.div
        {...(shouldReduceMotion ? {} : sealAnimation)}
        style={shouldReduceMotion ? { rotate: -12 } : undefined}
        className="absolute -right-6 -top-8 sm:-right-10 sm:-top-10"
      >
        <Seal size={128} className="drop-shadow-[0_4px_12px_rgba(161,61,43,0.25)]" />
      </motion.div>
    </div>
  );
}
