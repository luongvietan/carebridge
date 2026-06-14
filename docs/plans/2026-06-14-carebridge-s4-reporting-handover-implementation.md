# S4 — Reporting, Export, Testing, Deployment & Handover — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Implements subsystem **S4** from [the master plan](2026-06-14-carebridge-mvp-master-plan.md) (Phase 5 · Week 8). Builds on S0–S3 + DB layer. This is the launch subsystem.

**Goal:** CSV/XLSX export of all key datasets (the Founder's #1 priority), audit reports, full cross-browser/mobile testing per the PDF checklist, automated backups, deployment under CareBridge Connect Ltd, and admin handover with a user guide.

**Architecture:** Export endpoints stream from the existing `v_export_*` views, admin-gated, in CSV and XLSX. The Playwright suite expands to a Chromium/Firefox/WebKit + mobile-viewport matrix exercising every journey in the PDF testing section. Deployment to Vercel with Supabase-managed daily backups; all accounts owned by the client.

**Tech Stack:** Next.js route handlers, a streaming CSV writer + `exceljs` (or `xlsx`) for XLSX, Playwright (multi-project), Vercel, Supabase backups.

## File structure
```
src/lib/export/csv.ts (+test)            # rows -> CSV string/stream
src/lib/export/xlsx.ts (+test)           # rows -> XLSX buffer
src/lib/export/datasets.ts               # registry: name -> v_export_* view + columns
src/app/api/export/[entity]/route.ts     # admin-gated CSV/XLSX download
src/app/admin/reports/page.tsx           # export buttons + audit report
e2e/matrix/*.spec.ts                     # cross-browser/mobile journeys
playwright.config.ts                     # add firefox, webkit, mobile projects
.github/workflows/ci.yml                 # extend with e2e matrix
docs/USER_GUIDE.md                       # admin/founder guide
```

---

## Task 1: CSV + XLSX serialisers

**Files:** `src/lib/export/csv.ts` (+test), `src/lib/export/xlsx.ts` (+test)

- [ ] **Step 1: Failing tests**
```ts
// csv.test.ts
import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";
describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([{ a: 'x,y', b: 'he said "hi"' }])).toBe('a,b\r\n"x,y","he said ""hi"""');
  });
  it("emits a header row even with no data", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b\r\n");
  });
});
// xlsx.test.ts — toXlsx(rows) returns a non-empty Buffer whose first bytes are the zip magic (PK\x03\x04)
```
- [ ] **Step 2: Run** `npm run test` → FAIL.
- [ ] **Step 3: Implement** `toCsv(rows, headers?)` (RFC-4180 quoting, CRLF) and `toXlsx(rows)` via `exceljs`.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(app): CSV and XLSX serialisers`

## Task 2: Dataset registry + export endpoint

**Files:** `src/lib/export/datasets.ts`, `src/app/api/export/[entity]/route.ts`

- [ ] **Step 1:** Registry mapping each export name to its view: `professionals→v_export_professionals`, `bookings→v_export_bookings`, `compliance→v_export_compliance`, `payments→v_export_payments`, `audit→v_export_audit` (+ clients, organisations, assessments, payouts).
- [ ] **Step 2:** Route handler `GET /api/export/[entity]?format=csv|xlsx`: require admin (service client + `is_admin` check on the caller), read the view, serialise, return with `Content-Disposition: attachment`.
- [ ] **Step 3: Verify** a non-admin request is rejected (401/403).
- [ ] **Step 4: Commit** `feat(app): admin-gated CSV/XLSX export endpoints over export views`

## Task 3: Reports page + audit report

**Files:** `src/app/admin/reports/page.tsx`

- [ ] **Step 1:** Export buttons per dataset (CSV + XLSX) and an audit report (filter `audit_log` by entity/actor/date) with export.
- [ ] **Step 2: Commit** `feat(app): admin reports page with exports and audit report`

## Task 4: Cross-browser + mobile test matrix

**Files:** `playwright.config.ts` (extend), `e2e/matrix/*.spec.ts`

- [ ] **Step 1:** Add Playwright projects: `chromium`, `firefox`, `webkit`, and mobile (`Pixel 7`, `iPhone 14`). Install browsers (`npx playwright install`).
- [ ] **Step 2:** Author smoke specs for each PDF testing item: registration, login, document upload, assessment, booking, payment (mocked), admin dashboard, mobile responsiveness — reusing helpers from S0–S3 E2E.
- [ ] **Step 3: Run** `npm run e2e` across the matrix → PASS (fix responsive issues found).
- [ ] **Step 4: Commit** `test(app): cross-browser and mobile E2E matrix`

## Task 5: CI extension

**Files:** `.github/workflows/ci.yml`

- [ ] **Step 1:** Add a job that starts the Supabase stack (or a test project), runs `npm run e2e` (chromium in CI), and uploads the Playwright report artifact. Keep pgTAP + unit + build from S0.
- [ ] **Step 2: Commit** `ci: run E2E and publish report`

## Task 6: Deployment (Vercel + domain + SSL)

**Files:** project settings (no code), `docs/DEPLOYMENT.md`

- [ ] **Step 1:** Create the Vercel project under CareBridge Connect Ltd; set env (`NEXT_PUBLIC_SUPABASE_URL`, anon/service keys, Stripe live keys, `RESEND_API_KEY`, `PAYOUT_ENC_KEY`) from the production Supabase project.
- [ ] **Step 2:** Connect the custom domain + verify SSL. Configure Supabase Auth `site_url`/redirect URLs and production SMTP (Resend).
- [ ] **Step 3:** Document the steps in `docs/DEPLOYMENT.md`. **Commit** `docs: deployment runbook`.

## Task 7: Backups + restore drill

**Files:** `docs/DEPLOYMENT.md` (extend)

- [ ] **Step 1:** Enable Supabase daily backups (PITR/scheduled) on the production project; schedule the `pg_cron` compliance sweep (already in `0015`, hosted-only).
- [ ] **Step 2:** Perform a restore drill into a scratch project; document the procedure. **Commit** `docs: backup and restore procedure`.

## Task 8: Admin handover + user guide

**Files:** `docs/USER_GUIDE.md`, `docs/HANDOVER.md`

- [ ] **Step 1:** Write `docs/USER_GUIDE.md` (admin: approve professionals, review documents, manage bookings/rates, record payouts, run exports; basic flows for each role).
- [ ] **Step 2:** Write `docs/HANDOVER.md` — transfer of repo ownership, hosting/domain/Stripe/Supabase accounts to CareBridge Connect Ltd, Founder admin access, source-code handover checklist (from PDF §13–14, §17).
- [ ] **Step 3: Commit** `docs: admin user guide and ownership handover checklist`

---

## Test strategy
Vitest for the CSV/XLSX serialisers and the dataset registry. Playwright matrix (Chromium/Firefox/WebKit + mobile) for the full PDF testing checklist. A manual restore-from-backup drill. Export endpoints assert admin-only access.

## Acceptance
Every key dataset exports to CSV and XLSX at any time (admin-only); audit reports available; all required browsers + mobile pass; daily backups verified by a restore drill; live on the owned domain with SSL; ownership transferred, source code handed over, user guide delivered — the PDF §13–14/§17 checklist satisfied.

## Self-review
Master-plan S4 coverage: export (T1–2), reports/audit (T3), testing matrix (T4–5), deploy (T6), backups (T7), handover/guide (T8). Mapped. Export over the pre-built `v_export_*` views keeps the Founder's #1 requirement first-class. Deployment/backup tasks are ops-doc tasks (no fake code placeholders); code tasks carry real serialiser code + tests.
