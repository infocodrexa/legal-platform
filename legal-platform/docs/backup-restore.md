# Backup & Restore

## What's automated

`POST /api/v1/admin/backups` (SUPER_ADMIN only) triggers a **logical
backup**: every row in every table listed in `src/utils/backup.js`'s
`BACKED_UP_MODELS` is read inside a single transaction (so the snapshot is
consistent — nothing added or changed mid-export), serialized to JSON,
gzip-compressed, and uploaded to the private S3 bucket under `backups/`.
A `BackupRecord` row tracks status (`IN_PROGRESS` → `COMPLETED`/`FAILED`),
file size, and who triggered it. Every trigger, download, and restore
request is written to the append-only `AuditLog`.

`RefreshToken` and `OtpVerification` are deliberately excluded — a restore
should force everyone to re-authenticate, not resurrect old session
tokens.

**This is a logical (row-level JSON) backup, not a `pg_dump` binary
backup.** It doesn't capture things outside application tables — sequence
counters, database-level permissions, extensions, etc. For a production
deployment, layer this on top of, not instead of, your hosting provider's
native Postgres backup mechanism (e.g. Supabase's point-in-time recovery)
or a real `pg_dump`/`pg_basebackup` schedule run at the infrastructure
level.

## What's NOT automated, and why

`POST /api/v1/admin/backups/:id/request-restore` does **not** restore
anything. It logs the request (who, when, why) and points back to this
document. Actually replaying a backup into a live database was
deliberately left as a manual procedure rather than a one-click button,
because doing it safely requires judgment calls that shouldn't be made by
code written and reviewed without access to a real staging database to
test against:

- **Insert order** — foreign keys mean tables must be restored in an order
  that doesn't violate a constraint (e.g. `User` before `LawyerProfile`
  before `Appointment`). `BACKED_UP_MODELS` in `backup.js` is *roughly* in
  a safe order already, but a bug here corrupts a production database —
  not something to ship without integration-testing against real Postgres.
- **What happens to data created after the backup** — a straightforward
  restore either wipes it (data loss) or the restore script needs
  conflict-resolution logic. That's a product decision, not just an
  engineering one.
- **Downtime coordination** — a real restore should stop write traffic
  first. That means either a maintenance-mode flag (doesn't exist yet) or
  accepting a window of inconsistency.

## Manual restore procedure (until the above is built)

1. **Freeze writes.** Put the app in maintenance mode, or at minimum stop
   the backend process, before touching the database.
2. **Download the backup.**
   `GET /api/v1/admin/backups/:id/download` returns a short-lived (120s)
   signed URL to the `.json.gz` file. Download it immediately — the URL
   expires fast on purpose, since the file contains every password hash
   in the system.
3. **Decompress and inspect.**
   ```bash
   gunzip backup-<id>.json.gz
   ```
   The result is `{ exportedAt, tables: { user: [...], blog: [...], ... } }`
   — one array per model, in the same shape Prisma returns from
   `findMany()`.
4. **Restore table by table, respecting foreign key order**, using
   `prisma.<model>.createMany({ data: tables.<model>, skipDuplicates: true })`
   via a one-off script, in this order: `user` → `lawyerProfile` →
   `workingHour` → `availabilitySlot` → `document` →
   `documentStatusHistory` → `appointment` → `payment` → `refund` →
   `auditLog` → `notification` → `chatMessage` → `review` →
   `supportTicket` → `supportTicketReply` → `blog` → `faq` →
   `testimonial` → `seoMeta` → `messageTemplate` → `service` → `lead` →
   `mediaAsset`.
5. **Decide what to do with post-backup data** before running the above —
   if the target database has rows created after the backup's
   `exportedAt` timestamp, decide explicitly whether to keep, merge, or
   discard them. Don't let a script decide silently.
6. **Verify**, then resume write traffic.

## Recommended next step for production

Automate steps 3–4 as a reviewed, tested CLI script (`scripts/restore.js`)
that takes a backup ID and a `--dry-run` flag, run against a staging
database first — every time — before ever running it against production.
