"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// The recurring signature element: a circular authentication stamp, styled
// after the round ink seals used on Indian legal/notarial documents.
// Circular text via SVG <textPath>, a checkmark at center standing in for
// "verified", and a triple-ring border for hand-stamped texture.
export function Seal({ className, label = "NYAYASETU", sublabel = "VERIFIED · TRUSTED", size = 120 }) {
  const uid = React.useId().replace(/:/g, "");
  const topPathId = `seal-top-${uid}`;
  const bottomPathId = `seal-bottom-${uid}`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn("text-seal", className)}
      aria-hidden="true"
    >
      <defs>
        <path id={topPathId} d="M 20,100 A 80,80 0 0 1 180,100" fill="none" />
        <path id={bottomPathId} d="M 180,100 A 80,80 0 0 1 20,100" fill="none" />
      </defs>

      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1.5" />

      <text fontSize="13" letterSpacing="2.5" fontFamily="var(--font-mono)" fontWeight="500" fill="currentColor">
        <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
      <text fontSize="10" letterSpacing="2" fontFamily="var(--font-mono)" fill="currentColor">
        <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">
          {sublabel}
        </textPath>
      </text>

      <path
        d="M 78 100 L 94 116 L 124 84"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
