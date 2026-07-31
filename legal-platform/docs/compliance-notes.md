# Compliance Notes — RBI-Aligned Payment Design

> Engineering-level compliance scaffolding, not legal advice. Before going
> live, get an actual compliance/legal review from a professional familiar
> with current RBI Payment Aggregator & Aggregator/Sub-merchant guidelines —
> regulations are updated periodically and this document reflects the
> design as of this build only.

This document maps each guardrail from the master spec (Section 2) to where
it's implemented in the backend.

## 1. No indefinite pooling of client funds

`LawyerProfile.razorpayAccountId` stores a Razorpay Route **linked account
ID**. On payment capture (`payment.service.js#attemptSettlement`), the
lawyer's payout share is transferred directly to that linked account via
`razorpay.payments.transfer()` rather than sitting in the platform's own
bank account. If a lawyer has no linked account yet, settlement is
deliberately skipped (not silently retried indefinitely) and the payment
stays `CAPTURED` for manual/admin settlement — this is a gap to close before
production: an ops job or admin dashboard action to complete deferred
settlements is not yet built (tracked for Phase 5, Admin dashboard).

## 2. Escrow-style settlement records

`Payment.status` is an enum (`CREATED → CAPTURED → SETTLED`, plus `FAILED` /
`REFUNDED`), never a boolean. Each transition is written inside a DB
transaction alongside an `AuditLog` row (see `payment.service.js`), so the
full `payment_intent → captured → settled_to_lawyer` trail is queryable
per-payment via `Payment.status` + the `AuditLog` entries for that
`entityId`.

## 3. KYC before payout eligibility

`LawyerProfile.kycStatus` (`PENDING/UNDER_REVIEW/VERIFIED/REJECTED`) gates
two things directly in code:
- `appointment.service.js#bookAppointment` refuses to book a slot unless
  `lawyerProfile.kycStatus === 'VERIFIED'`.
- `lawyer.service.js#setRazorpayAccountId` (Phase 6) refuses to link a
  Razorpay Route linked account unless `kycStatus === 'VERIFIED'`, and
  `payment.service.js#attemptSettlement` only transfers funds if that
  account is set. The account ID itself is encrypted at rest
  (`utils/encryption.js`, AES-256-GCM) and decrypted only at the moment of
  calling Razorpay's transfer API — never returned in any API response.

KYC documents (`licenseDocKey`, `panDocKey`) are private S3 object keys,
never public URLs — see point 6.

**Still open**: actually *creating* the Razorpay Route linked account (the
`POST /accounts` call against Razorpay's own API) isn't wired up — an admin
currently has to create it out-of-band (via Razorpay's dashboard or a
separate script) and paste the resulting ID into
`PATCH /lawyers/:id/razorpay-account`. Automating that creation call is a
reasonable next step but wasn't built here.

## 4. No storing of card/UPI credentials

`Payment` only ever stores `razorpayOrderId`, `razorpayPaymentId`, and
`razorpaySignature` (kept for audit/verification, not sensitive itself —
it's a signature, not a credential). No card or UPI field exists anywhere
in the schema. Checkout is expected to run client-side via Razorpay
Checkout/Standard; the backend never receives raw card data.

## 5. Refund SLA tracking

`Refund.status` (`REQUESTED → APPROVED/REJECTED → PROCESSING → PROCESSED/
FAILED`) plus `requestedAt`/`processedAt` timestamps
(`refund.service.js`) give a timestamped trail sufficient to compute
turnaround time per refund and flag SLA breaches in a future reporting
job.

## 6. Data localization

- `.env.example` defaults `AWS_REGION=ap-south-1` and documents that
  `DATABASE_URL` should point at a Supabase project in the same region.
- All document/KYC/invoice files go through `utils/s3.js`, which never
  constructs a public URL — only short-lived signed URLs
  (`S3_SIGNED_URL_EXPIRY_SECONDS`, default 300s) via
  `getSignedDownloadUrl()`.

Actually provisioning the Supabase project and S3 bucket in `ap-south-1`
is an infrastructure/ops step outside this codebase — nothing here can
enforce region at the account-provisioning level.

## 7. Invoice + GST fields

`payment.service.js#handlePaymentCaptured` generates a PDF via
`utils/invoice.js` (PDFKit, no headless browser) immediately after
capture, showing the lawyer's consultation fee and the platform commission
as **separate line items**, plus an optional `buyerGstin` field on
`Payment`. The PDF is stored as a private S3 object
(`Payment.gstInvoiceKey`) and served via signed URL alongside the payment
record. GST *rate* application is intentionally left blank pending an
actual tax-registration decision — this is a placeholder invoice, not a
tax-compliant one, until that's resolved.

## 8. Immutable audit logs

`AuditLog` has no `updatedAt`/`deletedAt` field by design, and no
update/delete function is exported from `utils/auditLog.js` — only
`writeAuditLog()` (an insert). Every payment and refund state transition
writes one. Nothing in the current codebase issues an `UPDATE` or
`DELETE` against `auditLog` — that invariant needs to stay true as new
modules are added; a code-review checklist item, since Prisma doesn't
enforce append-only at the schema level.

## Known gaps to close before production

- Razorpay Route linked-account **creation** (the `POST /accounts` call
  that produces the ID an admin then pastes into
  `PATCH /lawyers/:id/razorpay-account`) isn't automated yet — currently a
  manual/out-of-band step. The *storage and use* of that ID (encrypted at
  rest, KYC-gated, decrypted only at transfer time) is built as of Phase 6.
- Deferred settlements (KYC verified after a payment was already captured)
  have no retry job yet.
- GST rate/registration logic is a placeholder — needs real tax guidance
  before the invoice is usable for actual tax filing.
- This was built and reviewed without a live Postgres connection or real
  Razorpay/Google credentials (sandboxed dev environment) — run the full
  test suite against real staging credentials before deploying.
