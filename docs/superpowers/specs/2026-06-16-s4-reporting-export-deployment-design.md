# S4 — Reporting, Export, Cross-Browser Testing, Deployment & Handover — Design

> Subsystem **S4** (launch subsystem) of the CareBridge Connect MVP. Supersedes the
> 2026-06-14 master-plan-era S4 plan (`docs/plans/2026-06-14-carebridge-s4-reporting-handover-implementation.md`).
> Builds on S0–S3b + the DB layer. Single combined cycle: code (export + reports +
> test matrix) **and** ops (deployment, backups, handover) — all external pieces
> (Vercel, owned domain, production Supabase with backups/PITR, live Stripe + Resend
> keys) are confirmed ready, so the ops half is executed, not just documented.

## Goal

CSV/XLSX export of every key dataset (the Founder's #1 priority), an admin reports +
audit report page, a full cross-browser/mobile Playwright matrix per the PDF testing
checklist, production deployment under CareBridge Connect Ltd, automated backups with a
restore drill, and admin handover with a user guide and ownership-transfer checklist.

## Architecture

Export endpoints serialise the existing `v_export_*` views (admin-gated) to CSV and
XLSX. Four missing views are added so coverage is complete. The Playwright suite expands
to a Chromium/Firefox/WebKit + mobile-viewport matrix exercising every PDF journey.
Deployment targets Vercel with a production Supabase project (managed daily backups);
all accounts are owned by the client.

## Tech stack

Next.js route handlers, a hand-rolled RFC-4180 CSV writer + `exceljs` for XLSX,
Playwright (multi-project), Vercel, Supabase managed backups.

---

## 1. Export views — new migration `0030_export_views.sql`

Five `v_export_*` views already exist (`0014_content_views.sql`): bookings,
professionals, compliance, payments, audit. Add four to complete coverage. Mirror the
existing pattern (plain views; the export endpoint reads them through the service
client, which bypasses RLS — the app layer enforces admin-only).

- `v_export_clients` ← `private_clients`: `id, full_name, phone, email_contact, city, postcode, created_at`
- `v_export_organisations` ← `organisations`: `id, organisation_name, contact_person, phone, email_contact, city, postcode, cqc_registration_number, billing_email, created_at`
- `v_export_assessments` ← `assessment_attempts` ⋈ `professionals` ⋈ `professional_roles`: `professional full_name, role, attempt_number, score, passed, started_at, completed_at`
- `v_export_payouts` ← `payouts` ⋈ `professionals`: `id, full_name, booking_id, amount, currency, status, method, reference, recorded_at, paid_at`

**Excluded by design:** encrypted bank details in `professional_payout_details`
(`sort_code_enc`, `account_number_enc`) are never exported. `stripe_customer_id` is
omitted from the client/org exports (not needed for the Founder's reporting).

A pgTAP test asserts each new view exists and returns the expected columns.

## 2. Serialisers — `src/lib/export/`

- `csv.ts` — `toCsv(rows, headers?)`: RFC-4180 quoting (fields containing `,`, `"`, or
  newlines are double-quoted; embedded `"` doubled), CRLF line endings, **always** emits
  a header row (derived from `headers` or the first row's keys; with `headers` and no
  rows it emits just the header line).
- `xlsx.ts` — `toXlsx(rows, headers?)`: single worksheet via `exceljs`, returns a
  `Buffer` whose first bytes are the zip magic (`PK\x03\x04`).

Both unit-tested with vitest (quoting edge cases, empty-with-headers, zip magic).

## 3. Dataset registry + export endpoint

- `src/lib/export/datasets.ts` — registry mapping 9 export names to their view and an
  ordered column list: `professionals, clients, organisations, bookings, assessments,
  compliance, payments, payouts, audit`. Unknown names are rejected.
- `src/app/api/export/[entity]/route.ts` — `GET /api/export/[entity]?format=csv|xlsx`:
  1. `requireAdmin` (reuse the existing admin guard; a non-admin/unauthenticated caller
     gets `403`).
  2. Look up the entity in the registry (`404` if unknown; default `format=csv`).
  3. Read the view via the **service client**, ordered by the registry's columns.
  4. Serialise with `toCsv`/`toXlsx`; respond with
     `Content-Disposition: attachment; filename="carebridge-<entity>-<YYYY-MM-DD>.csv|xlsx"`
     and the correct content type.
  - The `audit` entity additionally accepts `from`, `to`, `entity_type`, `actor_type`
    query filters applied to `v_export_audit`.

## 4. Reports page — `src/app/admin/reports/page.tsx`

- `requireAdmin`-guarded server page; add the `/admin/reports` link to the admin nav
  (matching the S3b nav pattern).
- Per-dataset CSV + XLSX download controls (links to the export endpoint).
- An audit-report section: date range / entity type / actor type filters → a preview
  table + a "download filtered audit" control hitting the `audit` endpoint with the same
  query params.

## 5. Cross-browser + mobile test matrix

- `playwright.config.ts` — add projects: `chromium`, `firefox`, `webkit`, `Pixel 7`,
  `iPhone 14`. Run `npx playwright install` for the browser binaries.
- `e2e/matrix/*.spec.ts` — smoke specs covering the PDF checklist journeys, reusing
  S0–S3 helpers: public/landing pages, signup → email verify → login, onboarding wizard,
  booking create + accept, payment via a mocked/locally-signed Stripe webhook, the admin
  dashboard plus one export download, and mobile responsiveness.
- Full matrix runs locally; fix any responsive issues surfaced.

## 6. CI

Extend `.github/workflows/ci.yml`: keep the existing pgTAP + vitest + `next build` jobs;
add an e2e job that boots the local Supabase stack and runs the Playwright suite
**chromium-only** (for CI stability), uploading the Playwright HTML report as an
artifact.

## 7. Deployment (executed — externals confirmed ready)

Documented in `docs/DEPLOYMENT.md` as it is performed.

- **Production Supabase project** (distinct from the dev project `fnpozxbbbevdnpyfgyhs`):
  apply migrations `0000–0030`, load reference + compliance + assessment seeds, create
  Ana's founder/admin user, generate a **stable** production `PAYOUT_ENC_KEY` (rotating
  it later breaks stored bank details), set Auth `site_url` + redirect URLs, configure
  Resend SMTP.
- **Vercel project** under CareBridge Connect Ltd with env:
  `NEXT_PUBLIC_SUPABASE_URL`, anon key, service-role key, **live** `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `PAYOUT_ENC_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- **Custom domain + SSL**; point DNS, verify the certificate.
- **Live Stripe webhook** endpoint → `/api/stripe/webhook`; set the production webhook
  secret.
- **Rotate the dev service-role key** that was shared in chat before launch.

## 8. Backups + restore drill

Extend `docs/DEPLOYMENT.md`. Enable PITR / daily backups on the production project;
schedule the `pg_cron` compliance sweep (already in `0015`, hosted-only). Perform a
restore drill into a scratch project and document the procedure.

## 9. Handover docs

- `docs/USER_GUIDE.md` — admin flows (approve professionals, review documents, manage
  bookings/rates, record payouts, run exports) + basic per-role flows.
- `docs/HANDOVER.md` — ownership transfer of repo, Vercel, Supabase, Stripe, domain, and
  Resend accounts to CareBridge Connect Ltd; founder admin access; source-code handover
  checklist (PDF §13–14, §17).

---

## Test strategy

Vitest for the CSV/XLSX serialisers and the dataset registry. pgTAP for the four new
export views. Playwright matrix (Chromium/Firefox/WebKit + Pixel 7 / iPhone 14) for the
full PDF testing checklist. A manual restore-from-backup drill. Export endpoints assert
admin-only access (non-admin → 403).

## Acceptance

Every key dataset (9 total) exports to CSV and XLSX at any time, admin-only; audit
reports available with filters; all required browsers + mobile viewports pass; daily
backups verified by a restore drill; live on the owned domain with SSL; ownership
transferred, source code handed over, user guide delivered — the PDF §13–14 / §17
checklist satisfied.

## Out of scope / flagged

Not blocking the S4 build, but launch prerequisites owed by/with Ana: the real per-role
assessment question bank (replacing the 8 placeholders), her compliance/suspension
workflow sign-off, and the professional-status FROM-matrix
(`lib/admin/status-machine.ts`) confirmation. Known minor S3a follow-ups (duplicate
`pending` payment rows on concurrent checkout; finance date-filter UTC edge;
snapshot-derived revenue; partial-refund marking) are also out of scope here.
