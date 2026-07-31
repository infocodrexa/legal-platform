"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Video, MessageSquare, XCircle, Star, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LoadingState, ErrorState, getErrorMessage } from "@/components/dashboard/query-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useAppointment, useCancelAppointment } from "@/lib/hooks/useUserDashboard";
import { paymentApi } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const appointmentQuery = useAppointment(id);
  const cancelMutation = useCancelAppointment();
  const [payState, setPayState] = useState("idle"); // idle | processing | error
  const [payError, setPayError] = useState("");
  const [cancelError, setCancelError] = useState("");

  if (appointmentQuery.isLoading) return <LoadingState label="Loading appointment…" />;
  if (appointmentQuery.isError) return <ErrorState error={appointmentQuery.error} onRetry={appointmentQuery.refetch} />;

  const appt = appointmentQuery.data;
  const canCancel = ["REQUESTED", "ACCEPTED"].includes(appt.status);
  const needsPayment = appt.status === "ACCEPTED" && !appt.payment;

  async function handlePay() {
    setPayState("processing");
    setPayError("");
    try {
      const { data: orderRes } = await paymentApi.createOrder({ appointmentId: id });
      const order = orderRes.data;
      const result = await openRazorpayCheckout({
        order,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        appointmentLabel: `Consultation with ${appt.lawyerProfile?.user?.name || "your lawyer"}`,
      });
      await paymentApi.confirm({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });
      await appointmentQuery.refetch();
      setPayState("idle");
    } catch (err) {
      setPayError(err.message || getErrorMessage(err, "Payment could not be completed."));
      setPayState("error");
    }
  }

  async function handleCancel() {
    setCancelError("");
    try {
      await cancelMutation.mutateAsync({ id, reason: undefined });
    } catch (err) {
      setCancelError(getErrorMessage(err, "Couldn't cancel this appointment."));
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/appointments" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-seal">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to appointments
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg text-cream-white">
            {(appt.lawyerProfile?.user?.name || "L")[0]}
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink">{appt.lawyerProfile?.user?.name || "Lawyer"}</h1>
            <p className="text-sm text-ink-muted">{appt.lawyerProfile?.barCouncilId}</p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <Card className="mt-6 p-6">
        <dl className="grid grid-cols-2 gap-y-4 text-sm">
          <dt className="text-ink-muted">Scheduled for</dt>
          <dd className="text-right text-ink">{formatDateTime(appt.scheduledStart)}</dd>
          <dt className="text-ink-muted">Consultation fee</dt>
          <dd className="text-right font-mono text-ink">₹{appt.consultationCharge}</dd>
          <dt className="text-ink-muted">Meeting link</dt>
          <dd className="text-right text-ink">
            {appt.googleMeetLink ? (
              <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer" className="text-seal hover:underline">
                Open link
              </a>
            ) : (
              "Not yet generated"
            )}
          </dd>
        </dl>
      </Card>

      {payError && <p className="mt-4 text-sm text-seal">{payError}</p>}
      {cancelError && <p className="mt-4 text-sm text-seal">{cancelError}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {appt.googleMeetLink && appt.status === "ACCEPTED" && (
          <Button asChild>
            <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4" /> Join video call
            </a>
          </Button>
        )}
        {needsPayment && (
          <Button onClick={handlePay} disabled={payState === "processing"}>
            {payState === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Complete payment
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/dashboard/messages">
            <MessageSquare className="h-4 w-4" /> Message lawyer
          </Link>
        </Button>
        {appt.status === "COMPLETED" && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/reviews">
              <Star className="h-4 w-4" /> Leave a review
            </Link>
          </Button>
        )}
        {canCancel && (
          <Button variant="ghost" className="text-seal hover:bg-seal-wash" onClick={handleCancel} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancel appointment
          </Button>
        )}
      </div>
    </div>
  );
}
