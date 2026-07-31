"use client";

import { useState } from "react";
import { useActivityEvents } from "@/lib/hooks/useAdminDashboard";

export default function AdminActivityEventsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useActivityEvents({
    page,
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p>Activity timeline loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Activity Timeline</h1>

        <p className="mt-4 text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Activity events load nahi ho paye."}
        </p>
      </div>
    );
  }

  const responseData = data?.data?.data || data?.data || {};
  const events = responseData.events || responseData.items || responseData.results || [];
  const pagination = responseData.pagination || responseData.meta || {};

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Activity Timeline
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Platform par hone wali important activities dekhein.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Abhi koi activity event nahi mila.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {event.title || event.action || "Activity Event"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {event.description || "No description available"}
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  {event.createdAt
                    ? new Date(event.createdAt).toLocaleString()
                    : ""}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {event.entityType && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {event.entityType}
                  </span>
                )}

                {event.action && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                    {event.action}
                  </span>
                )}

                {event.user?.name && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    {event.user.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((currentPage) => currentPage - 1)}
          className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-slate-600">
          Page {pagination.page || page}
        </span>

        <button
          type="button"
          disabled={
            pagination.totalPages
              ? page >= pagination.totalPages
              : events.length < 20
          }
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}