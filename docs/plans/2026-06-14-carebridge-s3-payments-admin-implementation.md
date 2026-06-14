# S3 — Payments, Payouts & Admin Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Implements subsystem **S3** from [the master plan](2026-06-14-carebridge-mvp-master-plan.md) (Phase 4 · Weeks 6–7). Builds on S0–S2 + DB layer.

**Goal:** Stripe payment collection on booking confirmation, in-platform payout recording, financial/revenue reporting, and the full admin/founder dashboard — user management, the suspension/status workflow, central rate-card management, and search/filter.

**Architecture:** Stripe collects the client charge; a webhook reconciles `payments`. Payouts are **recorded** (not auto-disbursed) per the agreed MVP scope, with bank details encrypted via `pgcrypto`. Admin operations run as server actions with the service client and always write `audit_log`. Revenue derives from the existing `v_platform_revenue` view.

**Tech Stack:** `stripe` SDK, Stripe webhooks (test mode), Supabase service client, `pgcrypto`, Vitest, Playwright (Stripe mocked).

**Required inputs:** Stripe account (test keys for build, live keys under CareBridge Connect Ltd for launch). The confirmed status/suspension workflow (from S1 sign-off) drives Task 6.

## File structure
```
src/lib/stripe/client.ts                 # configured Stripe instance
src/lib/stripe/intents.ts (+test)        # amount = booking.total_client_charge -> PaymentIntent params
src/app/api/stripe/webhook/route.ts      # verify signature, reconcile payments
src/lib/payouts/record.ts (+test)        # payout payload + status transitions
src/lib/payouts/bank.ts                  # pgcrypto encrypt/decrypt helpers (server-only)
src/lib/admin/*-actions.ts               # users, suspensions, rates, payouts
src/app/admin/{users,bookings,finance,rates,compliance}/**
src/lib/search/professionals.ts (+test)  # filter predicate -> query builder args
```

---

## Task 1: pgcrypto bank-detail helpers + migration check

**Files:** `src/lib/payouts/bank.ts`, `supabase/migrations/0021_payout_crypto_fns.sql`, `supabase/tests/0022_payout_crypto_test.sql`

- [ ] **Step 1: pgTAP failing test** — round-trip encrypt/decrypt of a sort code via SQL helpers returns the original.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Migration** — `set_payout_details(professional_id, account_name, sort_code, account_number, key)` and `get_payout_last4(...)` using `pgp_sym_encrypt/decrypt` into `professional_payout_details.sort_code_enc/account_number_enc`, storing `account_number_last4`. Key supplied from `PAYOUT_ENC_KEY` env via the server action, never stored.
- [ ] **Step 4: Run** `npx supabase db reset && npx supabase test db` → PASS.
- [ ] **Step 5: Commit** `feat(db): encrypted payout-detail helpers (pgcrypto)`

## Task 2: Stripe payment intent on confirmation

**Files:** `src/lib/stripe/client.ts`, `src/lib/stripe/intents.ts` (+test), `src/lib/bookings/actions.ts` (extend confirm)

- [ ] **Step 1: Failing test** for `buildIntentParams(booking)` — amount in pence = `round(total_client_charge*100)`, currency, metadata `{ booking_id }`.
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement; on booking confirmation create a PaymentIntent for the client and insert a `payments` row (`status='pending'`). **Step 4:** PASS. **Step 5: Commit** `feat(app): create Stripe payment intent on booking confirmation`

## Task 3: Stripe webhook reconciliation

**Files:** `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1:** Verify the Stripe signature (`STRIPE_WEBHOOK_SECRET`); on `payment_intent.succeeded`/`payment_failed` update the matching `payments` row (`status`, `paid_at`) via service client; write `audit_log`.
- [ ] **Step 2: Verify** with `stripe listen`/CLI or a mocked signed event in a unit test.
- [ ] **Step 3: Commit** `feat(app): Stripe webhook reconciles payment status`

## Task 4: Payout recording

**Files:** `src/lib/payouts/record.ts` (+test), `src/lib/admin/payout-actions.ts`, `src/app/admin/finance/payouts/**`

- [ ] **Step 1: Failing test** for `nextPayoutStatus(current, action)` (`pending→recorded→paid`; invalid transitions throw).
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement; admin actions create a payout (amount = `booking.total_payout`), record method/reference, mark paid; capture encrypted bank details via Task 1 helpers. **Step 4:** PASS. **Step 5: Commit** `feat(app): admin payout recording with status transitions`

## Task 5: Financial views + revenue report

**Files:** `src/app/admin/finance/page.tsx`

- [ ] **Step 1:** Transaction history (payments + payouts) and platform revenue from `v_platform_revenue` (sum of platform fee), filterable by date.
- [ ] **Step 2: Commit** `feat(app): financial transactions and revenue report`

## Task 6: User management + suspension/status workflow

**Files:** `src/lib/admin/status-actions.ts` (+test), `src/app/admin/users/**`

- [ ] **Step 1: Failing test** for `applyStatusTransition(current, action)` covering the agreed workflow (e.g. `active --suspend--> temporarily_suspended`, `booking_restricted --reinstate--> active`, illegal transitions throw). Encodes Ana's signed-off workflow.
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement the transition map; admin actions apply it: update `professionals.professional_status`, insert `professional_status_actions` (reason_code, internal_notes, review_date), write `audit_log`. Approve/reject/suspend/reinstate from the user list.
- [ ] **Step 4:** PASS; verify a suspended professional's `can_accept_bookings` is false and reinstatement restores it.
- [ ] **Step 5: Commit** `feat(app): admin user management and suspension/status workflow`

## Task 7: Central rate-card management

**Files:** `src/lib/admin/rate-actions.ts` (+test), `src/app/admin/rates/**`

- [ ] **Step 1: Failing test** for `amendRate(roleId, newRates)` planner — closes the current active card (`effective_to = now`) and opens a new one (`effective_from = now`), preserving the unique-active invariant.
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement as a transaction (service client); UI to view history and amend rates per role. **Step 4:** PASS; verify existing bookings' snapshots are unchanged. **Step 5: Commit** `feat(app): central effective-dated rate-card management`

## Task 8: Search & filter professionals

**Files:** `src/lib/search/professionals.ts` (+test), `src/app/admin/users/page.tsx` (filters)

- [ ] **Step 1: Failing test** for `toQueryFilters(criteria)` mapping role/location/availability/DBS/registration/compliance/assessment status to query constraints.
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement; wire filter controls. **Step 4:** PASS. **Step 5: Commit** `feat(app): admin professional search and filtering`

## Task 9: E2E

**Files:** `e2e/payments-admin.spec.ts`

- [ ] **Step 1:** Booking → confirm → (mocked) payment succeeded → admin records payout → revenue report reflects the fee. Second flow: admin suspends a professional → `can_accept_bookings` false → reinstates → true.
- [ ] **Step 2: Run** `npm run e2e` → PASS. **Step 3: Commit** `test(app): payments + suspension admin E2E`

---

## Test strategy
Vitest for `intents`, `record`, `status-actions`, `rate-actions`, `search` (pure logic), and pgTAP for the crypto helpers. Stripe runs in test mode with mocked/forwarded webhooks. Playwright for the money + suspension journeys.

## Acceptance
Client payment collected via Stripe and reconciled by webhook; payouts recorded with encrypted bank details; revenue report correct; suspension/reinstate fully audited and gates booking eligibility; central rate amendments don't alter past bookings; search/filter works.

## Self-review
Master-plan S3 coverage: Stripe (T2–3), payouts (T1,T4), finance/revenue (T5), user mgmt + suspension (T6), rate mgmt (T7), search (T8). Mapped. Suspension transitions are unit-tested against the signed-off workflow. No placeholder ship-code; Stripe secrets via env.
