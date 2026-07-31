"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { DashPageHeading, EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { useMyPayments } from "@/lib/hooks/useUserDashboard";
import { paymentApi } from "@/lib/api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function InvoiceButton({ paymentId }) {
  const [state, setState] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  async function handleClick() {
    setState("loading");
    setError("");
    try {
      // The list endpoint doesn't include a signed invoice URL (it would
      // mean generating one for every row on every page load, most of
      // which never get clicked) — fetched on demand instead, matching
      // backend/src/services/payment.service.js#getPaymentForActor.
      const { data } = await paymentApi.get(paymentId);
      const url = data.data.invoiceUrl;
      if (!url) {
        setError("Invoice not generated yet.");
        setState("error");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setState("idle");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load the invoice."));
      setState("error");
    }
  }

  return (
    <div className="text-right">
      <Button size="sm" variant="ghost" onClick={handleClick} disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Invoice
      </Button>
      {error && <p className="mt-1 text-xs text-seal">{error}</p>}
    </div>
  );
}

export default function PaymentsPage() {
  const { data, isLoading, isError, error, refetch } = useMyPayments({ page: 1, limit: 50 });
  const payments = data?.data ?? [];

  return (
    <div>
      <DashPageHeading title="Payments" description="Every payment made for a consultation, with downloadable invoices." />

      {isLoading ? (
        <LoadingState label="Loading your payments…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : payments.length === 0 ? (
        <EmptyState icon="Receipt" title="No payments yet" description="Payments appear here once you book and pay for a consultation." />
      ) : (
        <div className="overflow-hidden rounded-card border border-paper-line bg-paper-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper-line bg-ink/[0.02] font-mono text-xs uppercase tracking-widest text-ink-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-ink/[0.015]">
                  <td className="px-5 py-4 text-ink-muted">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-4 font-mono text-ink">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-4">
                    {["CAPTURED", "SETTLED", "REFUNDED"].includes(p.status) && <InvoiceButton paymentId={p.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
