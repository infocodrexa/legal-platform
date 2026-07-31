// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { ChevronRight } from "lucide-react";
// import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
// import { StatusBadge } from "@/components/dashboard/status-badge";
// import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
// import { documentCategoryLabels } from "@/lib/constants";
// import { useReviewQueue } from "@/lib/hooks/useLawyerDashboard";

// function formatDate(iso) {
//   return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
// }

// const statusFilters = [
//   { label: "Queue (Pending + In Review)", value: "" },
//   { label: "Pending", value: "PENDING" },
//   { label: "Under review", value: "UNDER_REVIEW" },
// ];

// export default function LawyerDocumentsPage() {
//   const [statusFilter, setStatusFilter] = useState("");
//   const { data, isLoading, isError, error, refetch } = useReviewQueue({
//     ...(statusFilter && { status: statusFilter }),
//     page: 1,
//     limit: 50,
//   });
//   const documents = data?.data ?? [];

//   return (
//     <div>
//       <DashPageHeading title="Document Queue" description="Documents submitted for your review, oldest first." />

//       <div className="mb-5 flex flex-wrap gap-2">
//         {statusFilters.map((f) => (
//           <button
//             key={f.value}
//             onClick={() => setStatusFilter(f.value)}
//             className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
//               statusFilter === f.value ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
//             }`}
//           >
//             {f.label}
//           </button>
//         ))}
//       </div>

//       {isLoading ? (
//         <LoadingState label="Loading the review queue…" />
//       ) : isError ? (
//         <ErrorState error={error} onRetry={refetch} />
//       ) : documents.length === 0 ? (
//         <EmptyState icon="FileText" title="Queue is empty" description="Nothing waiting for review right now." />
//       ) : (
//         <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
//           <table className="w-full text-left text-sm">
//             <thead>
//               <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
//                 <th className="px-5 py-3 font-medium">Document</th>
//                 <th className="hidden px-5 py-3 font-medium sm:table-cell">Client</th>
//                 <th className="hidden px-5 py-3 font-medium md:table-cell">Category</th>
//                 <th className="hidden px-5 py-3 font-medium md:table-cell">Submitted</th>
//                 <th className="px-5 py-3 font-medium">Status</th>
//                 <th className="px-5 py-3" />
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-paper-line">
//               {documents.map((doc) => (
//                 <tr key={doc.id} className="hover:bg-ink/[0.015]">
//                   <td className="px-5 py-4">
//                     <Link href={`/lawyer/documents/${doc.id}`} className="font-medium text-ink hover:text-seal">
//                       {doc.originalFileName}
//                     </Link>
//                   </td>
//                   <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{doc.user?.name}</td>
//                   <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{documentCategoryLabels[doc.category]}</td>
//                   <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{formatDate(doc.createdAt)}</td>
//                   <td className="px-5 py-4">
//                     <StatusBadge status={doc.status} />
//                   </td>
//                   <td className="px-5 py-4 text-right">
//                     <Link href={`/lawyer/documents/${doc.id}`} className="text-ink-muted hover:text-seal">
//                       <ChevronRight className="h-4 w-4" />
//                     </Link>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }





"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  ChevronRight,
  FileSearch,
  FileText,
  Search,
} from "lucide-react";

import {
  DashPageHeading,
  EmptyState,
} from "@/components/dashboard/empty-state";

import { StatusBadge } from "@/components/dashboard/status-badge";

import {
  ErrorState,
  LoadingState,
} from "@/components/dashboard/query-states";

import { Button } from "@/components/ui/button";
import { documentCategoryLabels } from "@/lib/constants";

import { useReviewQueue } from "@/lib/hooks/useLawyerDashboard";

function formatDate(iso) {
  if (!iso) return "Not available";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDocumentName(document) {
  return (
    document.originalFileName ||
    document.fileName ||
    "Untitled document"
  );
}

const statusFilters = [
  {
    label: "All",
    value: "",
  },
  {
    label: "Pending",
    value: "PENDING",
  },
  {
    label: "Under review",
    value: "UNDER_REVIEW",
  },
  {
    label: "Verified",
    value: "VERIFIED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
  {
    label: "Re-upload required",
    value: "REUPLOAD_REQUIRED",
  },
];

export default function LawyerDocumentsPage() {
  const [statusFilter, setStatusFilter] =
    useState("");

  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useReviewQueue({
    ...(statusFilter && {
      status: statusFilter,
    }),
    page: 1,
    limit: 50,
  });

  const documents = data?.data ?? [];

  const filteredDocuments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return documents;

    return documents.filter((document) => {
      const values = [
        getDocumentName(document),
        document.user?.name,
        document.user?.email,
        document.category,
        document.status,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [documents, search]);

  return (
    <div>
      <DashPageHeading
        title="Document Queue"
        description="Review submitted client documents with clear client and appointment context."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() =>
                setStatusFilter(filter.value)
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? "border-ink bg-ink text-cream-white"
                  : "border-paper-line text-ink-muted hover:border-ink/30"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search client or document…"
            className="h-10 w-full rounded-md border border-paper-line bg-paper-raised pl-9 pr-3 text-sm text-ink outline-none transition focus:border-seal focus:ring-1 focus:ring-seal"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading the review queue…" />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={refetch}
        />
      ) : documents.length === 0 ? (
        <EmptyState
  icon="FileText"
  title={
    statusFilter
      ? `No ${statusFilter.toLowerCase().replaceAll("_", " ")} documents`
      : "No documents found"
  }
  description={
    statusFilter
      ? "No documents are available with this status."
      : "No client documents have been submitted yet."
  }
/>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-card border border-paper-line bg-paper-raised px-5 py-14 text-center">
          <FileSearch className="mx-auto h-9 w-9 text-ink-muted" />

          <p className="mt-3 text-sm font-medium text-ink">
            No matching documents
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            Try another client name or
            document name.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                  <th className="px-5 py-3 font-medium">
                    Document
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Client
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Appointment / Context
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Category
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Submitted
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-paper-line">
                {filteredDocuments.map(
                  (document) => {
                    const appointmentId =
                      document.appointment?.id ||
                      document.appointmentId;

                    return (
                      <tr
                        key={document.id}
                        className="hover:bg-ink/[0.015]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-paper">
                              <FileText className="h-4 w-4 text-ink-muted" />
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/lawyer/documents/${document.id}`}
                                className="block max-w-xs truncate font-medium text-ink hover:text-seal"
                              >
                                {getDocumentName(
                                  document
                                )}
                              </Link>

                              <p className="mt-0.5 text-[11px] text-ink-muted">
                                ID:{" "}
                                {String(
                                  document.id
                                ).slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-ink">
                            {document.user?.name ||
                              "Unknown client"}
                          </p>

                          {document.user?.email && (
                            <p className="mt-0.5 text-xs text-ink-muted">
                              {document.user.email}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-ink-muted">
                          {appointmentId ? (
                            <Link
                              href={`/lawyer/appointments/${appointmentId}`}
                              className="inline-flex items-center gap-1 font-medium text-seal hover:underline"
                            >
                              View appointment
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <span>
                              General document review
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-ink-muted">
                          {documentCategoryLabels[
                            document.category
                          ] ||
                            document.category ||
                            "Other"}
                        </td>

                        <td className="px-5 py-4 text-ink-muted">
                          {formatDate(
                            document.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              document.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/lawyer/documents/${document.id}`}
                            >
                              {document.status ===
                                "PENDING"
                                ? "Review"
                                : "View"}

                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}