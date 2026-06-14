# S2 — Clients, Organisations, Bookings & Matching — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Implements subsystem **S2** from [the master plan](2026-06-14-carebridge-mvp-master-plan.md) (Phase 3 · Weeks 4–5). Builds on S0 + S1 + DB layer.

**Goal:** Client and organisation registration, the combination booking model (open-market accept + admin assign) with compliance enforced at acceptance/assignment, booking cancellations, and email notifications.

**Architecture:** Booking creation resolves the active rate card and **snapshots** the per-hour rates onto the booking (the DB already freezes totals via generated columns). Eligibility (`can_accept_bookings` + role match) is enforced both in `src/lib/bookings` and by a DB trigger so it cannot be bypassed. Notifications are sent through a small `src/lib/notifications` adapter (Mailpit locally, Resend in production).

**Tech Stack:** Next.js server actions, Supabase, Stripe customer creation (payment collection itself is S3), Resend (prod email), Vitest, Playwright.

## File structure
```
src/app/client/register/page.tsx        src/app/organisation/register/page.tsx
src/app/client/bookings/**               src/app/organisation/bookings/**
src/app/professional/bookings/**         # open + assigned, accept/decline, history
src/lib/rates/snapshot.ts (+test)        # resolve active rate_card -> snapshot fields
src/lib/bookings/create.ts (+test)       # build booking insert payload
src/lib/bookings/eligibility.ts (+test)  # can this professional take this booking?
src/lib/bookings/actions.ts              # createBooking, acceptBooking, declineBooking, assignBooking, cancelBooking
src/lib/notifications/send.ts            # template + channel adapter
```

---

## Task 1: Client & organisation registration

**Files:** `src/lib/validation/accounts.ts` (+test), `src/lib/accounts/actions.ts`, `src/app/client/register/page.tsx`, `src/app/organisation/register/page.tsx`

- [ ] **Step 1: Failing test** for `clientSchema`/`organisationSchema` (org requires name + contact; CQC optional).
- [ ] **Step 2: Run** `npm run test` → FAIL.
- [ ] **Step 3:** Implement schemas; `saveClientProfile`/`saveOrganisationProfile` server actions insert `private_clients`/`organisations` (RLS self) and create a Stripe customer id (stub helper now; real key wired in S3) stored on the row.
- [ ] **Step 4:** Registration pages for each (shown after signup for those roles).
- [ ] **Step 5: Run** `npm run test` → PASS; commit `feat(app): client and organisation profile registration`

## Task 2: Rate snapshot builder

**Files:** `src/lib/rates/snapshot.ts` (+test)

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { buildSnapshot } from "./snapshot";
describe("buildSnapshot", () => {
  it("derives platform fee when type is derived", () => {
    const s = buildSnapshot({ client_charge_rate: 40, professional_payout_rate: 28, platform_fee_type: "derived", platform_fee_value: null, currency: "GBP", id: "rc1" });
    expect(s).toMatchObject({ snap_client_charge_rate: 40, snap_payout_rate: 28, snap_platform_fee: 12, rate_card_id: "rc1" });
  });
  it("uses explicit fixed fee", () => {
    const s = buildSnapshot({ client_charge_rate: 40, professional_payout_rate: 28, platform_fee_type: "fixed", platform_fee_value: 5, currency: "GBP", id: "rc1" });
    expect(s.snap_platform_fee).toBe(5);
  });
});
```
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement `buildSnapshot(rateCard)` (derived = charge − payout; percentage = charge × value/100; fixed = value). **Step 4:** PASS. **Step 5: Commit** `feat(app): rate-card snapshot builder`

## Task 3: Booking creation

**Files:** `src/lib/bookings/create.ts` (+test), `src/lib/bookings/actions.ts` (`createBooking`), `src/app/client/bookings/new/page.tsx`, `src/app/organisation/bookings/new/page.tsx`

- [ ] **Step 1: Failing test** for `buildBookingInsert(input, rateCard)` — computes `duration_hours` from start/end, attaches snapshot, sets `requester`/`private_client_id` xor `organisation_id`.
- [ ] **Step 2: Run** → FAIL. **Step 3:** Implement; `createBooking` server action looks up the active `rate_cards` row for the role, calls `buildBookingInsert`, inserts `bookings`. **Step 4:** booking request form (role, date/time, duration, location, notes). **Step 5: Commit** `feat(app): booking request creation with rate snapshot`

## Task 4: Eligibility gate (lib + DB trigger)

**Files:** `src/lib/bookings/eligibility.ts` (+test), `supabase/migrations/0020_booking_eligibility_trigger.sql`, `supabase/tests/0021_booking_eligibility_test.sql`

- [ ] **Step 1: pgTAP failing test** — assigning a non-`active`/non-`approved` professional to a booking raises an exception.
- [ ] **Step 2: Run** `npx supabase test db` → FAIL.
- [ ] **Step 3: Migration** — `before insert or update of assigned_professional_id on bookings`: when `assigned_professional_id` is set, raise unless that professional `can_accept_bookings` and their role matches `professional_role_id`.
```sql
create or replace function public.enforce_booking_eligibility() returns trigger
language plpgsql as $$
declare ok boolean; rmatch boolean;
begin
  if new.assigned_professional_id is null then return new; end if;
  select can_accept_bookings, (professional_role_id = new.professional_role_id)
    into ok, rmatch from professionals where id = new.assigned_professional_id;
  if not coalesce(ok,false) then raise exception 'professional not eligible to accept bookings'; end if;
  if not coalesce(rmatch,false) then raise exception 'professional role does not match booking'; end if;
  return new;
end; $$;
create trigger trg_booking_eligibility before insert or update of assigned_professional_id
  on bookings for each row execute function public.enforce_booking_eligibility();
```
- [ ] **Step 4: Run** `npx supabase db reset && npx supabase test db` → PASS. **Step 5:** mirror the check in `eligibility.ts` (+Vitest) for friendly UI errors. **Step 6: Commit** `feat(db): enforce booking eligibility at assignment`

## Task 5: Open-market accept / decline

**Files:** `src/lib/bookings/actions.ts` (`acceptBooking`, `declineBooking`), `src/app/professional/bookings/page.tsx`

- [ ] **Step 1:** Professional bookings page lists open bookings for their role (RLS `bookings_prof_visibility`) + their assigned bookings + history.
- [ ] **Step 2:** `acceptBooking(id)` sets `assigned_professional_id`, `status='accepted'`, `accepted_at`; the trigger enforces eligibility; insert `booking_status_history`; notify requester.
- [ ] **Step 3:** `declineBooking(id)` records a decline (no assignment).
- [ ] **Step 4: Commit** `feat(app): professionals view, accept and decline open bookings`

## Task 6: Admin assign

**Files:** `src/lib/bookings/actions.ts` (`assignBooking`), `src/app/admin/bookings/**`

- [ ] **Step 1:** Admin booking list with an "assign" action choosing among eligible professionals (filtered by `can_accept_bookings` + role).
- [ ] **Step 2:** `assignBooking(bookingId, professionalId)` (service client) sets assignment + `booking_type='admin_assigned'`; trigger enforces eligibility; history + audit + notify.
- [ ] **Step 3: Commit** `feat(app): admin direct booking assignment`

## Task 7: Cancellation flow

**Files:** `src/lib/bookings/actions.ts` (`cancelBooking`), UI in each role's booking view

- [ ] **Step 1:** `cancelBooking(id, role, reason, isLastMinute)` sets `status='cancelled'`, inserts `booking_cancellations` + history; audit. (Repeated/last-minute cancellations feed S3 suspension reasons.)
- [ ] **Step 2: Commit** `feat(app): booking cancellation with last-minute flag`

## Task 8: Notifications

**Files:** `src/lib/notifications/send.ts`, wire into booking actions

- [ ] **Step 1:** `sendNotification(type, recipientUserId, payload)` — render the `notification_templates` row, insert a `notifications` row, and send via the channel adapter (Mailpit locally, Resend in prod via `RESEND_API_KEY`).
- [ ] **Step 2:** Wire booking request/confirmation + assessment/compliance result events.
- [ ] **Step 3: Commit** `feat(app): templated email notifications`

## Task 9: E2E

**Files:** `e2e/bookings.spec.ts`

- [ ] **Step 1:** Seed an approved, eligible professional + a client; client creates a booking; professional accepts; assert status + frozen totals. Second flow: admin assigns. Negative: a non-approved professional cannot accept (UI error / trigger).
- [ ] **Step 2: Run** `npm run e2e` → PASS. **Step 3: Commit** `test(app): booking accept/assign E2E with eligibility guard`

---

## Test strategy
Vitest for `snapshot`, `create`, `eligibility`, account schemas. pgTAP for the eligibility trigger. Playwright for both booking paths + the negative eligibility case.

## Acceptance
Both booking paths work; rate snapshot frozen on the booking; ineligible professionals blocked at accept/assign (DB-enforced); cancellations recorded; notifications fire.

## Self-review
Master-plan S2 coverage: registration (T1), snapshot (T2), creation (T3), eligibility (T4), open-market (T5), admin-assign (T6), cancellation (T7), notifications (T8). Mapped. Eligibility enforced at the DB so app bugs can't bypass it. No placeholder ship-code.
