# Legal Platform — Backend (Complete: Phases 1–7)

Express + Prisma + PostgreSQL backend for the Legal Document Verification &
Online Lawyer Consultation Platform. This covers the entire backend build
order from the master spec — all six phases, foundation through hardening.
The Next.js frontend (App Router) is a separate build.

**Phase 1 — Foundation:**
- Project scaffold (Express + Prisma + Postgres connection)
- Auth module: Register, OTP verification, Login (password + OTP), JWT
  access/refresh tokens **with rotation**, Forgot/Reset password, bcrypt
  hashing
- RBAC middleware (`authorize(...roles)`), rate limiting (general + strict
  auth limiter), Helmet, CORS, Zod input validation on every route
- Centralized error handling, structured API responses, graceful shutdown

**Phase 2 — Core Domain:**
- **Lawyer profile / KYC module** — create/update profile with license +
  PAN uploaded straight to a private S3 bucket (never touches local disk),
  admin KYC decision endpoint, weekly working-hours template, and a slot
  generator that materializes concrete bookable `AvailabilitySlot` rows
  from that template
- **Document module** — upload (multer → S3, PDF/JPEG/PNG/WEBP only, size
  capped), list/preview via short-lived signed URLs, replace, soft-delete,
  full append-only status history per document
- **Verification module** — lawyer review queue (FIFO), claim-to-review
  (`PENDING → UNDER_REVIEW`, reviewer locked to whoever started it),
  decision (`VERIFIED` / `REJECTED` / `REUPLOAD_REQUIRED`, remarks required
  on anything but VERIFIED)
- **Appointment module** — book an open slot (race-safe via conditional
  update), lawyer accept/reject, cancel (frees the slot), complete,
  reschedule (creates a new appointment linked back via
  `rescheduledFromId`, old one marked `RESCHEDULED`)

**Phase 3 — Money & Meetings:**
- **Payment module** — Razorpay order creation, checkout-signature
  confirmation, **raw-body webhook with HMAC verification**
  (`payment.captured` / `payment.failed` / `refund.processed`), commission
  split (`platformCommission` + `lawyerPayout`, exact to the paisa),
  Razorpay Route settlement transfer to the lawyer's linked account, and
  GST-style PDF invoice generation (PDFKit, straight to S3, no headless
  browser)
- **Refund module** — `REQUESTED → APPROVED/REJECTED → PROCESSING →
  PROCESSED/FAILED`, with SLA timestamps and an actual Razorpay refund call
- **Google Meet module** — auto-creates a Calendar event + Meet link when a
  lawyer accepts an appointment, cleans it up on cancel/reschedule, plus a
  cron-based reminder job (`node-cron`) that emails both parties ahead of
  the consultation
- **Append-only `AuditLog`** — every payment/refund/KYC state change is
  recorded via `writeAuditLog()`, an insert-only helper

See `/docs/compliance-notes.md` for how each RBI-aligned guardrail from the
master spec maps to actual code, including the gaps still open before this
is production-ready.

**Phase 4 — Communication:**
- **Notification module** — `Notification` row per (user, channel, event) so
  email and WhatsApp delivery are tracked and retriable independently.
  `notificationTemplates.js` renders both channels from one `data` object;
  triggers are wired into appointment accept/reject/cancel/reschedule,
  document verification decisions, KYC decisions, and payment/refund
  events. WhatsApp goes through `whatsapp.service.js` (Meta Business Cloud
  API, plain `fetch`, no extra HTTP dependency) and is a no-op logger until
  `WHATSAPP_ENABLED=true` and real approved template names are set.
- **Chat module** — Socket.io, JWT-authenticated handshake (same access
  token as REST), appointment-scoped rooms. `chat:message` / `chat:typing`
  / `chat:read` events, file sharing via a REST upload endpoint that hands
  back a private S3 key for the client to reference in the next
  `chat:message`, and read receipts. Chat only opens once the lawyer has
  accepted (`ACCEPTED`/`COMPLETED` appointments) — not before, not after
  cancellation. A message only triggers an email nudge if the recipient
  isn't actively connected (in-memory presence tracking), so active
  conversations don't get spammed with email per message. End-to-end
  tested with a real Socket.io client/server pair (auth handshake, room
  join, message broadcast, typing, read receipts, and rejecting a
  non-participant from joining).
- **Security fixes found during this phase's review** — several endpoints
  from Phases 2–3 were returning raw internal fields in API responses:
  `passwordHash` via unscoped `include: { user: true }` on Appointment
  responses, and raw private-S3 object keys (`licenseDocKey`, `panDocKey`,
  `fileKey`, `attachmentKey`) instead of only their signed URLs. All fixed
  in this pass — see `SAFE_PARTICIPANTS_INCLUDE` in
  `appointment.service.js` and the `omitDocKeys` / `omitFileKey` /
  `omitAttachmentKey` helpers in `lawyer.service.js` / `document.service.js`
  / `chat.service.js`. Verified with a live socket test asserting neither
  field appears in the wire payload.

**Phase 5 — Admin & CMS:**
- **Admin dashboard** — analytics overview (user/lawyer/appointment counts,
  revenue, pending KYC/documents, open tickets), revenue-over-time grouped
  by day or month, user list/detail/search, ban (kills all active sessions
  immediately) and force-logout, lawyer listing, platform-wide payment
  listing, and read access to the append-only `AuditLog`. Every mutating
  admin action (ban, force-logout, KYC decision, refund decision) writes an
  audit log entry.
- **CMS** — Blog (draft/publish/archive workflow, auto-generated unique
  slugs with collision handling, cover image via private S3 + signed URL),
  FAQ, curated Testimonials, per-path SEO metadata (title/description/
  canonical/schema.org JSON-LD, fetched by the frontend per-route), and
  `GET /sitemap.xml` / `GET /robots.txt` at the site root (auto-includes
  every published blog post).
- **Message templates** — admin-editable overrides for notification
  copy (`{{variable}}` interpolation), checked first before falling back to
  the Phase 4 static registry, plus a preview endpoint that renders through
  the exact same code path a real send would use — so "preview" can never
  drift from "what actually gets sent."
- **Review & Support Ticket modules** — one review per completed
  appointment with admin moderation (unpublish without deleting, so the
  rating still counts toward the average); support tickets with a reply
  thread, priority-ordered admin queue, and assignment.
- **Naming gotcha caught during this phase**: Prisma's client-accessor
  naming lowercases only the *first* character of a model name, so
  `model FAQ` would've generated the awkward `prisma.fAQ` — renamed to
  `Faq`/`SeoMeta` (→ `prisma.faq` / `prisma.seoMeta`) before this could
  become a live bug once the client is actually generated.
- **Validator bug caught and fixed**: a `.transform()` that `throw`s a
  plain `Error` (as opposed to using `ctx.addIssue` + `z.NEVER`) breaks
  Zod's `safeParse()` contract — it leaks the exception instead of
  returning `{ success: false }`, which would have crashed the `validate`
  middleware on bad input. Confirmed the failure mode first, then fixed it
  in `seo.validator.js`'s `schemaJson` field.

## Requirements

- Node.js >= 18.18
- A PostgreSQL database (Supabase recommended, region `ap-south-1` for
  data-localization — see compliance notes in the master spec, Section 2)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in DATABASE_URL, JWT secrets, SMTP creds in .env

npx prisma migrate dev --name init   # creates tables from prisma/schema.prisma
npx prisma generate                  # regenerates the Prisma client

npm run dev                          # starts on http://localhost:5000
```

> **Note on this sandbox:** `prisma generate` could not be verified in the
> environment this scaffold was built in, because it needs to download the
> Prisma query engine binary from `binaries.prisma.sh`, which isn't reachable
> from that sandbox's network allowlist. Every `.js` file has been
> individually syntax-checked (`node --check`) and the app boots and serves
> `/health` correctly once the Prisma client is generated. Run
> `npx prisma generate` locally — it will work normally with unrestricted
> network access.

## Environment variables

See `.env.example` for the full list with comments. Never commit a real
`.env` file.

## Project structure

```
repo/
  backend/
    prisma/
      schema.prisma        # Phase 1: User, RefreshToken, OtpVerification
                            # Phase 2: LawyerProfile, WorkingHour,
                            #   AvailabilitySlot, Document,
                            #   DocumentStatusHistory, Appointment
                            # Phase 3: Payment, Refund, AuditLog
                            # Phase 4: Notification, ChatMessage
    src/
      config/               # env validation (Zod), Prisma/S3/Razorpay/Calendar clients
      controllers/           # HTTP layer — thin, calls into services/
      routes/                 # Express routers
      services/                # Business logic
      realtime/                 # Socket.io server (chat)
      middlewares/               # auth, rbac, rate limiting, validation, errors, upload
      validators/                 # Zod schemas per module
      utils/                       # jwt, otp, asyncHandler, apiResponse, s3, invoice, auditLog
      app.js                       # Express app wiring (webhook raw-body route lives here)
      server.js                     # Entrypoint — http.Server + Socket.io, Prisma connect, reminder cron, graceful shutdown
  docs/
    compliance-notes.md      # RBI-aligned design decisions (Sec 2 of the master spec) mapped to code
```

## API surface (Phase 1)

All routes are prefixed with `/api/v1`.

| Method | Route                          | Auth           | Description                                  |
|--------|---------------------------------|----------------|-----------------------------------------------|
| GET    | `/health`                       | none           | Liveness check                                |
| POST   | `/auth/register`                | none           | Create account, sends REGISTER OTP to email   |
| POST   | `/auth/otp/request`             | none           | Request/resend OTP for a given purpose        |
| POST   | `/auth/otp/verify-registration` | none           | Verify REGISTER OTP → marks verified, logs in |
| POST   | `/auth/login`                   | none           | Login with identifier + password              |
| POST   | `/auth/login/otp`               | none           | Passwordless login via OTP                    |
| POST   | `/auth/refresh-token`           | refresh cookie | Rotates refresh token, issues new access token|
| POST   | `/auth/logout`                  | refresh cookie | Revokes the current refresh token             |
| POST   | `/auth/forgot-password`         | none           | Sends RESET_PASSWORD OTP                      |
| POST   | `/auth/reset-password`          | none           | Verifies OTP, sets new password, kills sessions|
| GET    | `/users/me`                     | Bearer token   | Current user's profile                        |
| GET    | `/users`                        | ADMIN/SUPER_ADMIN | List users (RBAC example)                  |

The refresh token is set as an `httpOnly`, `sameSite=strict` cookie scoped
to `/api/v1/auth`. The access token is returned in the JSON body and should
be sent as `Authorization: Bearer <token>` on subsequent requests.

### Phase 2 API surface

| Method | Route                                | Auth                    | Description                              |
|--------|----------------------------------------|--------------------------|--------------------------------------------|
| POST   | `/lawyers/profile`                     | any authenticated user  | Create/update lawyer profile + KYC docs (multipart: `licenseDoc`, `panDoc`) |
| GET    | `/lawyers/profile/me`                  | LAWYER                  | Own profile with signed doc URLs         |
| PATCH  | `/lawyers/:lawyerProfileId/kyc`        | ADMIN/SUPER_ADMIN        | Approve/reject KYC                       |
| PUT    | `/lawyers/working-hours`               | LAWYER                  | Replace weekly availability template     |
| POST   | `/lawyers/slots/generate`              | LAWYER                  | Materialize bookable slots for a date range |
| GET    | `/lawyers/:lawyerProfileId/slots`      | none (public)            | Browse a lawyer's open slots             |
| POST   | `/documents`                           | authenticated            | Upload a document (multipart: `file`)    |
| GET    | `/documents`                           | authenticated            | List own documents                       |
| GET    | `/documents/:documentId`               | authenticated            | Preview (signed URL) — owner only        |
| GET    | `/documents/:documentId/history`       | authenticated            | Status history — owner only              |
| PUT    | `/documents/:documentId`               | authenticated            | Replace file — resets to PENDING         |
| DELETE | `/documents/:documentId`               | authenticated            | Soft-delete (only while still mutable)   |
| GET    | `/verification/queue`                  | LAWYER/ADMIN/SUPER_ADMIN | FIFO review queue                        |
| GET    | `/verification/:documentId`            | LAWYER/ADMIN/SUPER_ADMIN | Document detail + signed preview URL     |
| POST   | `/verification/:documentId/start`      | LAWYER/ADMIN/SUPER_ADMIN | Claim for review                         |
| POST   | `/verification/:documentId/decision`   | LAWYER/ADMIN/SUPER_ADMIN | Verify/reject/request reupload           |
| POST   | `/appointments`                        | authenticated            | Book an open slot                        |
| GET    | `/appointments/mine`                   | authenticated            | Own appointments (as client)             |
| GET    | `/appointments/lawyer/mine`            | LAWYER                  | Own appointments (as lawyer)             |
| GET    | `/appointments/:appointmentId`         | owner (user/lawyer) or admin | Detail                              |
| POST   | `/appointments/:appointmentId/respond` | LAWYER                  | Accept/reject a REQUESTED appointment    |
| POST   | `/appointments/:appointmentId/cancel`  | owner (user/lawyer) or admin | Cancel — frees the slot             |
| POST   | `/appointments/:appointmentId/complete`| LAWYER                  | Mark an ACCEPTED appointment COMPLETED   |
| POST   | `/appointments/:appointmentId/reschedule` | owner (user/lawyer) or admin | Book a new slot, link to the old |

### Phase 3 API surface

| Method | Route                              | Auth                     | Description                                    |
|--------|--------------------------------------|---------------------------|--------------------------------------------------|
| POST   | `/payments/orders`                   | authenticated             | Create a Razorpay order for an ACCEPTED appointment |
| POST   | `/payments/confirm`                  | authenticated             | Client checkout-success callback (signature-verified, idempotent) |
| POST   | `/payments/webhook`                  | Razorpay (HMAC-signed)    | Server-to-server webhook — `payment.captured` / `payment.failed` / `refund.processed` |
| GET    | `/payments/mine`                     | authenticated             | Own payments                                    |
| GET    | `/payments/:paymentId`               | buyer/lawyer/admin        | Payment detail + signed invoice URL             |
| POST   | `/refunds`                           | authenticated             | Request a refund (payment must be CAPTURED/SETTLED, appointment CANCELLED) |
| GET    | `/refunds/:refundId`                 | requester or admin        | Refund detail                                   |
| GET    | `/refunds`                           | ADMIN/SUPER_ADMIN          | List all refunds                                |
| POST   | `/refunds/:refundId/approve`         | ADMIN/SUPER_ADMIN          | Approve a REQUESTED refund                      |
| POST   | `/refunds/:refundId/reject`          | ADMIN/SUPER_ADMIN          | Reject with a reason                            |
| POST   | `/refunds/:refundId/process`         | ADMIN/SUPER_ADMIN          | Actually call Razorpay to refund an APPROVED refund |

The webhook route (`POST /api/v1/payments/webhook`) is mounted directly in
`app.js` with `express.raw()`, ahead of the global `express.json()`
middleware — HMAC verification needs the exact raw bytes Razorpay signed,
not a re-serialized copy. Set `RAZORPAY_WEBHOOK_SECRET` to whatever secret
you configure in the Razorpay dashboard for this endpoint.

### Phase 4 API surface

| Method | Route                                    | Auth          | Description                                    |
|--------|--------------------------------------------|----------------|--------------------------------------------------|
| GET    | `/notifications/mine`                       | authenticated  | Own notification delivery history               |
| GET    | `/chat/:appointmentId/messages`             | participant    | Paginated chat history (chronological)          |
| POST   | `/chat/:appointmentId/attachments`          | participant    | Upload a file, get back a key to reference in a `chat:message` |

### Socket.io events

Connect with `io(url, { auth: { token: accessToken } })` — the same JWT
access token used for REST `Authorization: Bearer`. See
`src/realtime/socket.js`.

| Event (client → server) | Payload                                                              | Ack response                          |
|--------------------------|-----------------------------------------------------------------------|-----------------------------------------|
| `chat:join`               | `{ appointmentId }`                                                    | `{ success, message? }`                  |
| `chat:message`             | `{ appointmentId, content?, attachmentKey?, attachmentFileName?, attachmentMimeType? }` | `{ success, data? , message? }`          |
| `chat:typing`               | `{ appointmentId, isTyping }`                                            | none (fire-and-forget)                   |
| `chat:read`                  | `{ appointmentId }`                                                        | `{ success, message? }`                  |

| Event (server → client) | Payload                                              |
|---------------------------|---------------------------------------------------------|
| `chat:message`              | The created message row, broadcast to the appointment's room |
| `chat:typing`                 | `{ userId, isTyping }`, broadcast to everyone else in the room |
| `chat:read`                     | `{ userId, appointmentId, readAt, messageIds }`                  |
| `chat:error`                      | `{ message }` — emitted to the sender only, on a failed `chat:message` |

> **Note on a bug caught during review:** an earlier draft of
> `appointment.service.js` used `include: { user: true, lawyerProfile: {
> include: { user: true } } }` in several places, which would have returned
> the full `User` row — including `passwordHash` — straight into API
> responses for accept/cancel/reschedule. Caught and fixed before shipping;
> everything now goes through an explicit `select` (see
> `SAFE_PARTICIPANTS_INCLUDE` in that file). Worth knowing about if you add
> new endpoints that join across `User` — `include: { user: true }` is
> almost never what you want on a public-facing response.

### Phase 5 API surface

| Method | Route                                    | Auth               | Description                                |
|--------|--------------------------------------------|----------------------|-----------------------------------------------|
| GET    | `/admin/analytics/overview`                | ADMIN/SUPER_ADMIN    | Platform-wide counts + revenue summary        |
| GET    | `/admin/analytics/revenue`                 | ADMIN/SUPER_ADMIN    | Revenue grouped by day/month                  |
| GET    | `/admin/users`                             | ADMIN/SUPER_ADMIN    | List/search/filter users                      |
| GET    | `/admin/users/:userId`                     | ADMIN/SUPER_ADMIN    | User detail                                   |
| PATCH  | `/admin/users/:userId/ban`                 | ADMIN/SUPER_ADMIN    | Ban/unban — kills active sessions on ban      |
| POST   | `/admin/users/:userId/force-logout`        | ADMIN/SUPER_ADMIN    | Revoke all refresh tokens for a user          |
| GET    | `/admin/lawyers`                           | ADMIN/SUPER_ADMIN    | List lawyer profiles, filter by KYC status    |
| GET    | `/admin/payments`                          | ADMIN/SUPER_ADMIN    | Platform-wide payment listing                 |
| GET    | `/admin/audit-logs`                        | ADMIN/SUPER_ADMIN    | Read the append-only audit trail              |
| POST   | `/reviews`                                 | authenticated         | Review a COMPLETED appointment (once)         |
| GET    | `/reviews/lawyer/:lawyerProfileId`         | none (public)         | Published reviews + average rating            |
| GET    | `/reviews` / `PATCH /reviews/:id/moderate` | ADMIN/SUPER_ADMIN    | List all / publish-unpublish                  |
| POST   | `/support-tickets`                         | authenticated         | Open a ticket                                 |
| GET    | `/support-tickets/mine` / `/:id`           | owner or admin        | List own / detail                             |
| POST   | `/support-tickets/:id/replies`             | owner or admin        | Reply — admin reply auto-moves OPEN→IN_PROGRESS |
| PATCH  | `/support-tickets/:id/status` / `/assign`  | ADMIN/SUPER_ADMIN    | Resolve/close / assign to an admin            |
| GET    | `/blog` / `/blog/slug/:slug`               | none (public)         | Published posts only                          |
| POST/PUT/PATCH/DELETE `/blog/admin/...`    | ADMIN/SUPER_ADMIN    | Full CRUD + draft/publish/archive workflow    |
| GET    | `/faq`                                     | none (public)         | Published FAQs                                |
| CRUD   | `/faq/admin/...`                           | ADMIN/SUPER_ADMIN    | Manage FAQs                                   |
| GET    | `/testimonials`                            | none (public)         | Published testimonials                        |
| CRUD   | `/testimonials/admin/...`                  | ADMIN/SUPER_ADMIN    | Manage testimonials                           |
| GET    | `/seo?path=/services`                      | none (public)         | Per-path SEO metadata                         |
| POST/DELETE `/seo/admin/...`               | ADMIN/SUPER_ADMIN    | Upsert/delete SEO metadata                    |
| GET    | `/sitemap.xml` / `/robots.txt`             | none (public)         | At the site root, not under `/api/v1`         |
| GET/POST/DELETE `/admin/message-templates` | ADMIN/SUPER_ADMIN    | CMS overrides for notification content        |
| POST   | `/admin/message-templates/preview`         | ADMIN/SUPER_ADMIN    | Render a template with sample data            |

## Phase 6 — Security & Performance Hardening

This is the last backend phase in the build order. No new domain models —
it hardens what Phases 1–5 already built.

- **CSRF protection** — a double-submit cookie pair (`rlp_csrf_token`,
  non-httpOnly so the frontend can read and echo it in an `X-CSRF-Token`
  header) guards the two endpoints that authenticate via an ambient cookie
  (`POST /auth/refresh-token`, `POST /auth/logout`). `SameSite=strict` on
  the refresh cookie is already the primary defense; this is
  defense-in-depth for older browsers. Non-cookie clients (mobile apps
  passing `refreshToken` in the body) are correctly exempt — there's no
  ambient credential for a malicious page to ride on in that case, verified
  with direct middleware tests across all five branches (cookie+matching
  token, cookie+missing header, cookie+wrong token, cookie+no CSRF cookie,
  no-cookie-at-all passthrough).
- **XSS sanitization** (`utils/sanitize.js`, via `sanitize-html`) — every
  user-facing free-text field is sanitized before it touches the DB: chat
  messages, review comments, support ticket subject/description/replies,
  and testimonial/FAQ text strip *all* HTML (`sanitizePlainText`); blog
  content allows a safe formatting-tag allowlist with `javascript:`/`data:`
  URIs blocked (`sanitizeRichText`). Tested against real XSS payloads
  (`<script>`, `onerror=`, `javascript:` hrefs, `<iframe>`) — all
  neutralized, legitimate formatting preserved.
- **S3 bucket privacy check** (`utils/s3BucketCheck.js`) — runs at server
  startup, calls AWS's `GetPublicAccessBlock`/`GetBucketPolicyStatus` APIs
  and logs loudly (non-fatal) if the configured bucket isn't fully locked
  down. Every document/KYC/invoice/chat-attachment URL this app generates
  assumes the bucket is private.
- **Encryption at rest for a sensitive field** (`utils/encryption.js`,
  AES-256-GCM) — `LawyerProfile.razorpayAccountId` (a financial routing
  identifier) is encrypted before storage and only decrypted at the moment
  `payment.service.js` actually calls Razorpay's transfer API; it's never
  returned in any API response, encrypted or not. This also **closes a gap
  called out in Phase 3's compliance notes**: there's now an admin endpoint
  (`PATCH /lawyers/:id/razorpay-account`) to actually link an account,
  gated on `kycStatus === 'VERIFIED'`. Verified: unverified lawyers
  rejected, verified lawyers accepted, stored value is genuinely encrypted
  (not plaintext), round-trips correctly, and GCM's auth tag actually
  rejects tampered ciphertext (not just "looks encrypted").
- **Optional Redis caching** (`utils/cache.js`) — transparently no-ops to a
  direct DB read when `REDIS_URL` isn't set (same "optional integration"
  pattern as WhatsApp/Google Calendar elsewhere in this codebase). Wired
  into the read-heavy public endpoints (FAQ list, testimonials list,
  per-path SEO lookup) with cache TTLs kept intentionally shorter than the
  S3 signed-URL expiry, so a cached response's image URL can never go
  stale before the cache entry itself does. Tested cache hit/miss/
  invalidation cycle with a fake Redis client.
- **Pagination audit** — every `findMany` across the codebase was
  programmatically swept for a missing `take`/`skip`; the handful that were
  genuinely unbounded (chat unread-count, sitemap blog list, admin revenue
  query with no date range, working-hour templates, document status
  history) now have explicit caps.
- **Image optimization pipeline** (`utils/imageOptimize.js`, via `sharp`) —
  wired into `utils/s3.js#uploadPrivateObject` via an explicit `optimize`
  flag, deliberately **not** applied everywhere: marketing/CMS images (blog
  covers, testimonial avatars, SEO OG images) get resized (≤1920px),
  re-encoded, and stripped of EXIF metadata before upload. KYC documents,
  case documents, and chat attachments are deliberately left byte-exact —
  those can have evidentiary/legal significance where altering the
  uploaded bytes (even just re-encoding) is the wrong call. Verified with a
  real 4000×3000 synthetic image: resized to 1920×1440, ~5x smaller, no
  upscaling of already-small images, non-image files pass through
  untouched.
- **Content-Security-Policy** — since this backend is a pure JSON API (it
  never serves HTML/CSS/JS, only JSON or redirects to signed S3 URLs), the
  CSP is `default-src 'none'` — about as strict as it gets.

## Phase 7 — Services, Leads, Media Library, Backup

The last six previously-missing modules from the full 40-module review.
No hardening changes here — new domain surface only.

- **Services catalog** (`Service` model, `/api/v1/services`) — the
  practice-area content that was hardcoded on the frontend as
  `mock-data.js` now has a real admin-managed backend: CRUD, slug
  generation with collision handling (same pattern as Blog), publish
  toggle, cover image upload.
- **Contact & Lead Management** (`Lead` model, `/api/v1/leads`) — the
  public contact form now has somewhere real to submit to. Public
  `POST /leads` is rate-limited (reuses `authLimiter`) since it's an
  unauthenticated, spam-prone endpoint. Admin CRUD: status
  (`NEW → CONTACTED → CONVERTED/CLOSED`), notes, assignment to an admin.
  A confirmation email sends directly via `email.service.js` rather than
  through `notification.service.js` — **a lead usually has no `User`
  account yet, and `Notification.userId` is a required field**, so there's
  no row to attach a tracked notification to.
- **Media Library** (`MediaAsset` model, `/api/v1/admin/media`) — a
  centralized, admin-browsable index of every marketing/CMS image
  uploaded (blog covers, testimonial avatars, SEO OG images, service
  covers). **Deliberately does not include documents, KYC files, or chat
  attachments** — those already have their own access-controlled tables,
  and mixing them into a plainly admin-browsable asset library would leak
  private, user-owned files into a general browser. `logMediaAsset()` in
  `utils/mediaAsset.js` is called from exactly the upload paths that
  should be indexed, not wired in globally.
- **Backup & Restore** (`BackupRecord` model, `/api/v1/admin/backups`,
  `SUPER_ADMIN`-only — more tightly restricted than the rest of the admin
  surface, since a full export includes every password hash in the
  system) — `utils/backup.js` does a logical export (JSON, not a
  `pg_dump` binary) of every table inside a single transaction for a
  consistent snapshot, gzip-compresses it, and uploads it privately. The
  gzip round-trip was actually tested (compress → decompress → verify
  byte-identical), not just written and assumed correct.
  **Restore is deliberately NOT automated** — `request-restore` logs an
  audit-trailed request and points to `/docs/backup-restore.md`'s manual
  procedure instead of executing anything, because a safe automated
  restore needs foreign-key-safe insert ordering, a decision about
  post-backup data, and downtime coordination that shouldn't be decided by
  code that's never run against a real staging database.
- **A real leak caught during this phase's own review, not by a human
  flagging it in retrospect**: `BackupRecord.storageKey` (the raw S3 key
  for the backup archive) was being returned directly in the
  `trigger`/`list` API responses — the exact same pattern caught and
  fixed repeatedly in earlier phases (`Document.fileKey`,
  `LawyerProfile.licenseDocKey`, etc.), just in a new model. Fixed with an
  `omitStorageKey` helper before this phase shipped, not after.
- **Deployment & DevOps** — `Dockerfile` for both backend and frontend
  (multi-stage, non-root runtime user), root-level `docker-compose.yml`
  (Postgres + Redis + backend + frontend, health-checked startup
  ordering — validated as syntactically correct YAML, not run against a
  real Docker daemon, since Docker isn't available in this sandbox), and
  `.github/workflows/ci.yml` (lint/build on every PR, Docker build+push to
  GHCR on merge to `main`). **Deliberately stops at "image pushed to a
  registry"** — no actual deploy-to-a-host step, because that depends on
  a hosting choice this repo can't make for you. See
  `/docs/deployment.md` for the honest breakdown of what's automated vs.
  what still needs a human decision.

## Security notes carried into every future phase

- OTPs and passwords are never stored in plaintext (bcrypt hashed).
- Refresh tokens rotate on every use; reuse of a revoked token revokes all
  of that user's sessions (theft-detection pattern).
- Every route explicitly declares its allowed roles via `authorize(...)` —
  no implicit "any logged-in user" fallthrough for sensitive routes.
- `forgot-password` responds identically whether or not the account exists,
  to avoid user enumeration.
- Zod validates every request body/query/params before it reaches a
  controller.
- Raw private-S3 object keys are never returned in API responses — only
  signed URLs (or nothing). See `omitDocKeys`/`omitFileKey`/
  `omitAttachmentKey` — apply the same pattern to any new model that stores
  an S3 key.
- Zod `.transform()` callbacks must report failures via `ctx.addIssue()` +
  `return z.NEVER`, never a plain `throw` — a thrown `Error` inside a
  transform escapes `safeParse()`'s try/catch contract and crashes the
  `validate` middleware instead of returning a clean 422.
- Model names get their Prisma client accessor by lowercasing only the
  *first* character — an all-caps model like `FAQ` becomes `prisma.fAQ`,
  not `prisma.faq`. Name new acronym-ish models `Faq`/`SeoMeta`-style to
  keep the generated client accessor sane.
- Every new model with a stored file/S3 key needs its own `omit*Key`
  helper before its service functions return anything to a controller —
  this isn't a one-time fix, it's a checklist item for every future model
  (`BackupRecord.storageKey` needed the same treatment as everything
  else, and almost shipped without it).
