# Legal Platform — Frontend (Complete: Public Website + User, Lawyer & Admin Dashboards)

Next.js 15 (App Router, JavaScript) frontend for the Legal Document
Verification & Online Lawyer Consultation Platform. This is the complete
frontend delivery: the public marketing site, auth pages, and **all three
core authenticated dashboards** — User, Lawyer, and Admin/Super Admin,
including the four admin modules added to close out the full 40-module
scope (Services CMS, Leads, Media Library, Backups).
79 routes, `next build` clean, every route verified via raw HTML output
(including 404 edge cases) and a subset visually confirmed with a real
headless-Chrome screenshot pass.

## What's built

**Design system** — a distinctive visual identity ("The Register"): ink-navy
on stone-paper, a brick-red "seal" accent used like an actual stamp (not a
decorative gradient), brass details, and a circular authentication-seal SVG
as the recurring signature element. Full rationale in `src/app/globals.css`.
Built and reviewed against the frontend-design skill's process — see the
"Design notes" section below for what was deliberately avoided.

**Pages** (39 routes, all statically generated, `next build` passing clean):
- `/` — homepage (hero with an orchestrated seal-stamp animation, trust
  stats, how-it-works preview, services grid, why-us, featured lawyers,
  testimonials, FAQ preview, closing CTA)
- `/about`, `/how-it-works`, `/pricing`, `/faq`, `/contact` (working
  React Hook Form + Zod validated form), `/services`, `/services/[slug]`
  (6 practice areas, dynamic routes via `generateStaticParams`)
- `/lawyers`, `/lawyers/[id]` — directory + profile (6 mock lawyers)
- `/blog`, `/blog/[slug]` — 6 full mock articles with real body content
- `/legal/terms`, `/legal/privacy`, `/legal/refunds`, `/legal/disclaimer`
  — real, sensible boilerplate legal content (Tailwind Typography)
- `/login`, `/register` — wired to the **actual backend auth endpoint
  shapes** (`src/lib/api.js`), including the backend's real two-step
  register→OTP-verify flow. Untested against a live backend (see Gaps).
- `/sitemap.xml`, `/robots.txt` — Next.js-native dynamic routes
- `not-found.js` — styled 404

**Component library** (`src/components/ui/`) — hand-written shadcn/ui-style
primitives (Button, Card, Badge, Input, Textarea, Label, Separator,
Accordion, Sheet). The `shadcn` CLI couldn't run in the sandbox this was
built in (needs `ui.shadcn.com`, outside the network allowlist) — these are
written by hand in the same pattern (Radix primitives + CVA + Tailwind), not
a lesser substitute.

## User Dashboard (`/dashboard/*`)

A complete, working template for one of the three authenticated dashboards
— the pattern (shell, nav, mock-session, mock-data convention) is meant to
extend directly to the Lawyer and Admin dashboards next.

**10 screens**, all `next build`-clean:
- `/dashboard` — overview (stat cards, recent documents, upcoming appointments)
- `/dashboard/documents`, `/dashboard/documents/upload`, `/dashboard/documents/[id]`
  — list, drag-and-drop upload (React Hook Form + Zod, matches the
  backend's real category enum and file-type/size validation), detail with
  status history timeline
- `/dashboard/appointments`, `/dashboard/appointments/[id]` — list, detail
  with contextual actions (join video call, pay, message, review, cancel —
  only the actions valid for that appointment's actual status)
- `/dashboard/payments` — payment/invoice history
- `/dashboard/messages` — two-panel conversation view (static; real-time
  delivery connects over Socket.io per the backend's Chat module once wired)
- `/dashboard/reviews` — reviews given, with a prompt for completed-but-
  unreviewed consultations
- `/dashboard/support` — ticket list + new-ticket form
- `/dashboard/settings` — profile + password forms

**Shared dashboard infrastructure** (`src/components/dashboard/`,
`src/lib/dashboard-nav.js`, `src/lib/mock-session.js`,
`src/lib/dashboard-mock-data.js`) — sidebar+topbar shell (desktop fixed,
mobile drawer), `StatusBadge` mapping every backend status enum
(Document/Appointment/Payment/Refund/KYC/Ticket) to a consistent color,
`StatCard`, `EmptyState`. Nav configs already exist for Lawyer and Admin
roles in `dashboard-nav.js` — only the page routes themselves remain
unbuilt for those two roles.

**A real bug caught and fixed during this build**: `layout.js` (a Server
Component) was passing `navItems` — an array containing lucide-react icon
*component references* (functions) — as a prop into the Client Component
shell. Next.js's RSC layer can't serialize a function across that
boundary, and this failed `next build` outright (not a lint nit — a hard
prerendering error) on multiple pages. Fixed by passing a plain `role`
string instead and resolving icons from a name→component registry
(`icon-registry.jsx`) entirely inside the client bundle. Documented here
because it's an easy mistake to reintroduce when building the Lawyer/Admin
dashboards next — **never pass a component reference as a prop across a
Server→Client boundary; pass a string key and resolve it client-side**.

**Every route verified against raw HTML output** (not just `next build`
succeeding) — including the `/dashboard/appointments/[id]` 404 path for an
invalid ID, which correctly returns a 404 rather than crashing.

## Lawyer Dashboard (`/lawyer/*`)

The second of three dashboards, following the exact same shell/nav/mock-data
pattern as the User Dashboard.

**9 screens**, all `next build`-clean:
- `/lawyer` — overview (review queue count, pending requests, this
  month's payout, current consultation fee; a KYC-not-verified banner if
  applicable)
- `/lawyer/profile` — KYC status + license/PAN document slots + editable
  public profile (bio, specializations, experience, consultation fee)
- `/lawyer/documents`, `/lawyer/documents/[id]` — FIFO review queue,
  detail page implementing the **real backend workflow exactly**:
  `PENDING` → Start Review (claims it) → `UNDER_REVIEW` → decision
  (`VERIFIED` / `REUPLOAD_REQUIRED` / `REJECTED`, remarks required unless
  verifying — matches the backend's actual validation rule)
- `/lawyer/appointments`, `/lawyer/appointments/[id]` — accept/decline
  requests inline from the list, detail page with status-appropriate
  actions (accept/decline → join call → mark completed)
- `/lawyer/availability` — weekly working-hours template (toggle day,
  edit start/end time) + a "generate slots" action, mirroring the
  backend's `WorkingHour` → `AvailabilitySlot` two-step model, plus a list
  of already-generated upcoming slots showing booked/open
- `/lawyer/earnings` — payment history with the commission split shown
  as separate columns (fee / − commission / = payout), matching the
  backend's escrow-style `Payment` status trail
- `/lawyer/messages` — same two-panel pattern as the user dashboard
- `/lawyer/reviews` — reviews received, with an average-rating stat card
- `/lawyer/settings` — account + password forms

**A correctness bug caught during this build's own review** (not by the
build failing — `next build` doesn't check HTTP status codes): the
document and appointment detail pages initially rendered a "not found"
message inline with a **200 status** for an invalid ID, instead of a real
404. `notFound()` from `next/navigation` works in Client Components too
(it's not Server-Component-only) — fixed and re-verified with a live
server that both the invalid-ID (404) and valid-ID (200) cases now return
the correct status.

## Admin Dashboard (`/admin/*`)

The third and final dashboard — same shell/nav/mock-data pattern, role
`"ADMIN"` (also covers `SUPER_ADMIN`, which shares the same nav for now
since the backend doesn't yet distinguish their permissions either).

**17 routes**, all `next build`-clean:
- `/admin` — platform overview: user/lawyer counts, revenue captured vs.
  commission, a 6-month revenue bar chart, a "needs attention" panel
  (pending KYC, documents in queue, refund requests, open tickets), recent
  support tickets
- `/admin/users`, `/admin/users/[id]` — search UI (unwired), role badges,
  ban/unban + force-logout actions — **admin accounts are explicitly
  excluded from ban/force-logout**, matching a real guard in the backend's
  `admin.service.js#setBanStatus`
- `/admin/lawyers`, `/admin/lawyers/[id]` — **the core KYC approval
  workflow**: Approve/Reject buttons only render when `kycStatus` is
  `PENDING`/`UNDER_REVIEW` (matches the backend's actual state-gating in
  `lawyer.service.js#decideKyc`), previous rejection remarks shown if
  present, license/PAN document slots
- `/admin/documents` — platform-wide document oversight (read-only;
  verification decisions happen in the lawyer's own review queue, not
  here — matches how the backend actually splits that responsibility)
- `/admin/appointments` — platform-wide appointment oversight
- `/admin/payments` — payment ledger with commission shown per row
- `/admin/refunds` — **the full refund lifecycle workflow**:
  Approve/Reject buttons for `REQUESTED`, a "Process refund" button for
  `APPROVED`, nothing actionable once `PROCESSED` — mirrors the backend's
  `REQUESTED → APPROVED/REJECTED → PROCESSING → PROCESSED` state machine
  exactly, including the "no action possible on a terminal state" case
- `/admin/analytics` — the fuller version of the overview's chart: revenue
  over time, lawyer-payout vs. platform-commission breakdown, appointments
  by status as proportional bars
- `/admin/cms/blog`, `/admin/cms/faq`, `/admin/cms/testimonials`,
  `/admin/cms/seo` — CMS management list views (draft/published states,
  publish toggles) for every content type the backend's CMS module
  supports
- `/admin/support` — priority-ordered ticket queue across the whole
  platform (vs. the user/lawyer dashboards, which only show their own)
- `/admin/audit-logs` — **read-only by design**, with an explicit banner
  explaining why: the backend never exposes an update/delete operation for
  this table, so the frontend doesn't pretend to either
- `/admin/settings` — platform-wide settings form (commission %, site
  identity, reminder lead time). **This is genuinely new surface, not
  just a UI wrapper around an existing endpoint** — the backend currently
  has no `Settings` model or `/admin/settings` route; these values live as
  environment variables. The form is built and clearly commented as the
  frontend half of closing that gap.

**Four more screens**, added to close out the remaining backend modules
from the full 40-module review — all built against the real endpoints
that now exist (`backend/src/routes/service.routes.js`,
`lead.routes.js`, `media.routes.js`, `backup.routes.js`):
- `/admin/cms/services` — the practice-area catalog, now admin-managed
  instead of hardcoded (mirrors the Blog CMS pattern)
- `/admin/leads`, `/admin/leads/[id]` — **has genuinely working
  client-side search and status filtering**, not static UI like the
  lawyer directory's filter pills. It's filtering data already in memory,
  so there's no reason for it to be fake.
- `/admin/media` — browses the new centralized `MediaAsset` index;
  filter pills for blog covers / testimonial avatars / SEO images /
  service covers. Explicitly does not show documents or KYC files,
  matching the backend's deliberate scoping (see the backend README).
- `/admin/backups` — trigger a backup, see history with status
  (`IN_PROGRESS`/`COMPLETED`/`FAILED`), download or request a restore.
  Correctly shows no action buttons on a `FAILED` row — there's nothing
  to download or restore from a backup that didn't complete.

The public contact form (`src/components/site/contact-form.jsx`) is now
wired to the real `POST /api/v1/leads` endpoint instead of simulating
submission — matching the backend's validator shape exactly.

## Design notes

Deliberately avoided the three generic-AI-design defaults (warm cream +
serif + terracotta; near-black + neon; broadsheet hairline grid). Instead:
cool stone paper (`#ede9e1`, not cream), ink-navy (`#16233f`, not black), a
brick-red seal (`#a13d2b`) used sparingly and specifically as a stamp motif
tied to how Indian legal documents are actually authenticated. Numbered
steps only appear where the content is a genuine sequence (How It Works —
upload → verify → book → meet); nowhere else. Full token rationale is
commented in `globals.css`.

**Screenshot-verified**, not just built-and-assumed: the homepage hero
(desktop + mobile), mobile nav, services grid, dark why-us band, and footer
were all rendered with a real headless Chrome instance and visually
reviewed during this build — not just compiled successfully.

## Known gap: next/font/google

The intended type system is Source Serif 4 (display) / Inter (body) / IBM
Plex Mono (utility) via `next/font/google`. **This sandbox's network can't
reach `fonts.googleapis.com`**, so `next build` fails outright if
`next/font/google` is used here. `src/app/layout.js` currently uses
matched system-font stacks instead, with the intended `next/font/google`
setup fully written out in a comment in that same file — restoring it is a
one-line swap once deployed somewhere with normal internet access.

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm run dev                  # http://localhost:3000
```

To restore the designed Google Fonts (see above), edit `src/app/layout.js`
per the comment block at the top of that file, then remove the
`fontVariablesStyle` fallback.

## What's NOT in this delivery (see the gap analysis from earlier in this build)

- **Super Admin as a distinct role** — the frontend (and the backend) treat
  `SUPER_ADMIN` identically to `ADMIN` everywhere right now. If Super Admin
  is meant to have extra powers (e.g. managing other admins), that
  distinction doesn't exist yet on either side.
- **Live backend integration** — `/login`, `/register`, and every
  dashboard page (User, Lawyer, Admin) are wired to the correct data
  shapes but read from mock data files (`src/lib/mock-data.js`,
  `src/lib/dashboard-mock-data.js`, `src/lib/lawyer-mock-data.js`,
  `src/lib/admin-mock-data.js`) and a mock session
  (`src/lib/mock-session.js`) rather than a live API — there's no
  reachable Postgres/Prisma in this sandbox (see the backend's own
  README). `accessToken`/`csrfToken` are held in memory only (intentional
  — never `localStorage`), which means a page reload currently loses the
  session; a real app needs a silent `/auth/refresh-token` call on mount
  to restore it. Swapping mock data for real `api.js` calls, screen by
  screen, is the main remaining step.
- **Every button that reads "wired to X once live"** — ban/unban,
  force-logout, KYC approve/reject, refund approve/reject/process, blog
  publish, document preview, and similar admin actions are built as real
  UI (correct conditional rendering based on status, correct labels) but
  the click handlers aren't wired to a mutation yet, since there's nothing
  live to call.
- **Search** — the lawyer directory's filter pills and the admin users
  search box are still static UI, not wired to actual filtering.
  `/admin/leads` is the one exception — its search and status filters
  are genuinely functional (client-side, against in-memory mock data),
  proving the pattern; the same approach should be applied to the other
  two once they're backed by real data instead of mock arrays.
- **Contact form** — now wired to the real `POST /api/v1/leads` endpoint
  (see the Admin Dashboard section above), not simulated. Like every
  other API call in this frontend, it's never been run against a live
  backend in this sandbox.
- **Document upload / chat attachments** — the upload UI validates and
  simulates submission; wiring to the real
  `multipart/form-data POST /documents` call (and Socket.io for live chat)
  is noted inline in the relevant files.
- **Admin Settings has no backend counterpart yet** — see the Admin
  Dashboard section above; this is new frontend surface for a backend
  module (platform-wide settings) that doesn't exist as a DB-backed
  feature yet, only as environment variables.
- Accessibility and responsiveness were checked during the build (visible
  focus rings, semantic headings, `aria-label`s on icon-only buttons,
  `prefers-reduced-motion` respected in the hero animation, mobile nav
  tested at 390px, dashboard shell tested at both breakpoints) but not run
  through an automated audit tool (e.g. axe, Lighthouse) — worth doing
  before shipping.

## A lesson worth keeping in mind for future screens

Passing a **component reference** (e.g. a lucide-react icon, or anything
else that's a function) as a prop from a Server Component into a Client
Component — or the reverse — breaks Next's RSC serialization and fails
`next build` outright, not just lint. It bit this build twice (once in the
dashboard shell's nav items, once in `StatCard`/`EmptyState`'s `icon`
prop) before landing on the fix used everywhere now: pass a **string
name** across any Server↔Client boundary and resolve it to a real
component *inside* the client bundle via `src/components/dashboard/
icon-registry.jsx`. Follow that pattern for any new icon-accepting
component.

