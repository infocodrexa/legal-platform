"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-muted">
      <Loader2 className="h-6 w-6 animate-spin text-seal" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// Extracts a human-readable message from any axios/network error shape —
// used everywhere instead of each page re-deriving it differently.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.details) {
    const details = error.response.data.details;
    const firstField = Object.keys(details)[0];
    if (firstField) return details[firstField][0];
  }
  if (error.message === "Network Error") return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

export function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-seal/20 bg-seal-wash px-6 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-seal" />
      <div>
        <p className="font-display text-lg text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted">{getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}
