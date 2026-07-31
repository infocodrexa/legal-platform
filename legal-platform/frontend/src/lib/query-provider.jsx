"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function AppQueryProvider({ children }) {
  // Created inside the component (not module scope) so each request gets
  // its own client on the server, but the client is stable across
  // re-renders in the browser via useState's lazy initializer.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              // Don't retry 4xx (bad request, forbidden, not found, etc.)
              // — retrying won't fix a validation error or a permissions
              // problem. Do retry network errors / 5xx up to twice.
              const status = error?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false, // never auto-retry a POST/PATCH/DELETE — could double-submit
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
