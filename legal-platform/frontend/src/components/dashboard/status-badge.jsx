import { Badge } from "@/components/ui/badge";

// Maps every status string used across the backend's enums to a Badge
// variant, so a single component handles Document/Appointment/Payment/
// Refund/KYC/Ticket status display consistently everywhere.
const STATUS_VARIANTS = {
  // Positive / final-good states
  VERIFIED: "verified",
  ACCEPTED: "verified",
  COMPLETED: "verified",
  CAPTURED: "verified",
  SETTLED: "verified",
  PROCESSED: "verified",
  RESOLVED: "verified",
  CLOSED: "ink",
  PUBLISHED: "verified",

  // Neutral / in-progress states
  PENDING: "brass",
  UNDER_REVIEW: "brass",
  REQUESTED: "brass",
  CREATED: "brass",
  PROCESSING: "brass",
  IN_PROGRESS: "brass",
  APPROVED: "brass",
  DRAFT: "brass",

  // Negative / needs-attention states
  REJECTED: "seal",
  FAILED: "seal",
  CANCELLED: "seal",
  REUPLOAD_REQUIRED: "seal",
  REFUNDED: "seal",
  SKIPPED: "ink",
};

export function StatusBadge({ status }) {
  const variant = STATUS_VARIANTS[status] ?? "ink";
  const label = status?.replace(/_/g, " ") ?? "Unknown";
  return <Badge variant={variant}>{label}</Badge>;
}
