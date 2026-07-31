// "use client";

// import { useState } from "react";
// import { DashPageHeading } from "@/components/dashboard/empty-state";
// import { StatusBadge } from "@/components/dashboard/status-badge";
// import { LoadingState, ErrorState } from "@/components/dashboard/query-states";
// import { documentCategoryLabels } from "@/lib/constants";
// import { useAdminDocuments } from "@/lib/hooks/useAdminDashboard";

// function formatDate(iso) {
//   return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
// }

// const statusFilters = ["", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "REUPLOAD_REQUIRED"];

// export default function AdminDocumentsPage() {
//   const [statusFilter, setStatusFilter] = useState("");
//   const { data, isLoading, isError, error, refetch } = useAdminDocuments({
//     ...(statusFilter && { status: statusFilter }),
//     page: 1,
//     limit: 50,
//   });
//   const documents = data?.data ?? [];

//   return (
//     <div>
//       <DashPageHeading title="Documents" description="Platform-wide document oversight — verification itself happens in the lawyer review queue." />

//       <div className="mb-5 flex flex-wrap gap-2">
//         {statusFilters.map((s) => (
//           <button
//             key={s}
//             onClick={() => setStatusFilter(s)}
//             className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
//               statusFilter === s ? "border-ink bg-ink text-cream-white" : "border-paper-line text-ink-muted hover:border-ink/30"
//             }`}
//           >
//             {s ? s.replace(/_/g, " ") : "All"}
//           </button>
//         ))}
//       </div>

//       {isLoading ? (
//         <LoadingState label="Loading documents…" />
//       ) : isError ? (
//         <ErrorState error={error} onRetry={refetch} />
//       ) : (
//         <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
//           <table className="w-full text-left text-sm">
//             <thead>
//               <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
//                 <th className="px-5 py-3 font-medium">Document</th>
//                 <th className="hidden px-5 py-3 font-medium sm:table-cell">Client</th>
//                 <th className="hidden px-5 py-3 font-medium md:table-cell">Category</th>
//                 <th className="hidden px-5 py-3 font-medium md:table-cell">Uploaded</th>
//                 <th className="px-5 py-3 font-medium">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-paper-line">
//               {documents.map((doc) => (
//                 <tr key={doc.id} className="hover:bg-ink/[0.015]">
//                   <td className="px-5 py-4 font-medium text-ink">{doc.originalFileName}</td>
//                   <td className="hidden px-5 py-4 text-ink-muted sm:table-cell">{doc.user?.name}</td>
//                   <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{documentCategoryLabels[doc.category]}</td>
//                   <td className="hidden px-5 py-4 text-ink-muted md:table-cell">{formatDate(doc.createdAt)}</td>
//                   <td className="px-5 py-4">
//                     <StatusBadge status={doc.status} />
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {documents.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No documents match this filter.</p>}
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { DashPageHeading } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  LoadingState,
  ErrorState,
} from "@/components/dashboard/query-states";
import { documentCategoryLabels } from "@/lib/constants";
import {
  useAdminDocuments,
  useDeleteAdminDocument,
} from "@/lib/hooks/useAdminDashboard";
import { documentApi } from "@/lib/api";

function formatDate(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

const statusFilters = [
  "",
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "REUPLOAD_REQUIRED",
];

export default function AdminDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminDocuments({
    ...(statusFilter && {
      status: statusFilter,
    }),
    page: 1,
    limit: 50,
  });

  const deleteDocument = useDeleteAdminDocument();

  const documents = data?.data ?? [];

  async function handleView(documentId) {
    try {
      setActionError("");
      setPreviewLoadingId(documentId);

      const response = await documentApi.get(documentId);
      const document = response?.data?.data;

      if (!document?.previewUrl) {
        throw new Error("Preview URL was not generated.");
      }

      window.open(
        document.previewUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (viewError) {
      setActionError(getErrorMessage(viewError));
    } finally {
      setPreviewLoadingId(null);
    }
  }

  async function handleDelete() {
    if (!selectedDocument?.id) return;

    try {
      setActionError("");

      await deleteDocument.mutateAsync(
        selectedDocument.id
      );

      setSelectedDocument(null);
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError));
    }
  }

  return (
    <div>
      <DashPageHeading
        title="Documents"
        description="Platform-wide document oversight — verification itself happens in the lawyer review queue."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setActionError("");
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === status
                ? "border-ink bg-ink text-cream-white"
                : "border-paper-line text-ink-muted hover:border-ink/30"
            }`}
          >
            {status
              ? status.replace(/_/g, " ")
              : "All"}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-5 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading documents…" />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={refetch}
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-paper-line bg-paper-raised">
          <table className="min-w-[850px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">
                  Document
                </th>

                <th className="px-5 py-3 font-medium">
                  Client
                </th>

                <th className="px-5 py-3 font-medium">
                  Category
                </th>

                <th className="px-5 py-3 font-medium">
                  Uploaded
                </th>

                <th className="px-5 py-3 font-medium">
                  Status
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-paper-line">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-ink/[0.015]"
                >
                  <td className="max-w-[260px] px-5 py-4">
                    <p
                      className="truncate font-medium text-ink"
                      title={doc.originalFileName}
                    >
                      {doc.originalFileName ||
                        "Untitled document"}
                    </p>

                    <p className="mt-1 text-xs text-ink-muted">
                      {doc.mimeType || "Unknown file type"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-ink-muted">
                    <p className="font-medium text-ink">
                      {doc.user?.name || "Unknown client"}
                    </p>

                    {doc.user?.email && (
                      <p className="mt-1 text-xs">
                        {doc.user.email}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-ink-muted">
                    {documentCategoryLabels[
                      doc.category
                    ] ||
                      doc.category ||
                      "—"}
                  </td>

                  <td className="px-5 py-4 text-ink-muted">
                    {formatDate(doc.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={doc.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleView(doc.id)
                        }
                        disabled={
                          previewLoadingId === doc.id
                        }
                        className="rounded-md border border-paper-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {previewLoadingId === doc.id
                          ? "Opening…"
                          : "View"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocument(doc)
                        }
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {documents.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">
              No documents match this filter.
            </p>
          )}
        </div>
      )}

      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-document-title"
        >
          <div className="w-full max-w-md rounded-card border border-paper-line bg-paper-raised p-6 shadow-xl">
            <h2
              id="delete-document-title"
              className="text-lg font-semibold text-ink"
            >
              Delete document?
            </h2>

            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Are you sure you want to delete{" "}
              <span className="font-medium text-ink">
                {selectedDocument.originalFileName}
              </span>
              ? This document will be removed from the
              dashboard and its active storage file will
              also be deleted.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedDocument(null)
                }
                disabled={deleteDocument.isPending}
                className="rounded-md border border-paper-line px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteDocument.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteDocument.isPending
                  ? "Deleting…"
                  : "Delete document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}