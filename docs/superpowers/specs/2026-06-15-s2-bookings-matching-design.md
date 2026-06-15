# S2 — Bookings & Combination Matching — Design

> Date: 2026-06-15. Client-facing **Phase 3**. Implements subsystem **S2** from the
> [master plan](../../plans/2026-06-14-carebridge-mvp-master-plan.md) (Phase 3 · Weeks 4–5),
> building on S0 (auth/RBAC), S1 (onboarding/compliance) and the DB layer. Supersedes the
> 2026-06-14 S2 implementation plan's design assumptions; the implementation plan will be
> regenerated from this spec.

## Goal

Client & organisation registration, the **combination booking model** (open-market self-accept
+ admin direct-assign), with compliance/eligibility enforced at the database, single-shift
bookings whose rate is frozen on creation, per-professional declines, cancellations with a
last-minute flag, templated email notifications, and a Stripe-customer stub.

## Architecture (approach C: formal state machine + DB triggers)

Pure, framework-free domain logic in `src/lib/*` (unit-tested without React/Supabase). A single
**booking state machine** is the source of truth for legal transitions; every server action routes
through it. The database is the backstop for the two invariants that must never be bypassed:
professional **eligibility** (trigger) and **single-accept concurrency** (conditional update).
Notifications go through a small adapter with a swappable channel sender (Resend in prod, local
SMTP→Mailpit in dev). Stripe customer creation is stubbed behind a stable signature for S3.

## Locked decisions

- **Scope:** full plan — bookings + matching + cancellation + **notifications** + **Stripe-customer stub**.
- **Booking shape:** single shift (one window, one professional per `bookings` row). No recurrence.
- **Matching:** role + eligibility filter, manual choice. No scoring/auto-rank. No location/availability filtering in S2.
- **Rate cards:** seeded/effective-dated in the DB; S2 only resolves + snapshots. Admin editor is S3.
- **Declines:** persisted in a new `booking_declines` table (per-professional hide).
- **Last-minute cancellation:** `< 24h` before `scheduled_start` → `is_last_minute = true`.
- **Admin assignment:** `assigned` is the settled state in S2 (no separate pro-confirm step yet).

## Booking state machine (`src/lib/bookings/transitions.ts`)

A legal-transition table keyed by `(status, action, actor)`; `applyTransition(current, action, actor)`
returns the next status or a typed error before any write.

**States used in S2:** `open`, `accepted`, `assigned`, `cancelled`.
**Defined but wired in S3:** `confirmed`, `in_progress`, `completed`, `no_show` (present in the table,
not exposed in UI — the machine is complete; S3 lights them up).

| From | Action | Actor | To | Notes |
|------|--------|-------|----|-------|
| *(none)* | `create` | client / org | `open` | `booking_type=open_market` |
| `open` | `accept` | professional | `accepted` | sets `assigned_professional_id`, `accepted_at`; concurrency-guarded |
| `open` | `decline` | professional | `open` | no status change; records a per-pro decline |
| `open` | `assign` | admin | `assigned` | sets `assigned_professional_id`, `assigned_by`, `booking_type=admin_assigned` |
| `open` | `cancel` | requester / admin | `cancelled` | |
| `accepted` | `cancel` | requester / professional / admin | `cancelled` | last-minute flag if `< 24h` |
| `assigned` | `cancel` | requester / professional / admin | `cancelled` | last-minute flag if `< 24h` |

## Modules

**Pure libs (Vitest):**
- `src/lib/rates/snapshot.ts` — `buildSnapshot(rateCard)` → `{snap_client_charge_rate, snap_payout_rate, snap_platform_fee, rate_card_id, snap_currency}`. Fee: `derived` = charge − payout; `percentage` = charge × value/100; `fixed` = value.
- `src/lib/bookings/create.ts` — `buildBookingInsert(input, rateCard)`: computes `duration_hours` from start/end, attaches snapshot, sets `private_client_id` xor `organisation_id`.
- `src/lib/bookings/eligibility.ts` — `canAccept(professional, booking)` (role match + `can_accept_bookings`) for friendly UI errors; mirrors the DB trigger.
- `src/lib/bookings/transitions.ts` — the state machine (above).
- `src/lib/validation/accounts.ts` — `clientSchema`, `organisationSchema` (org requires name + contact; CQC optional).
- `src/lib/notifications/send.ts` — `sendNotification(type, recipientUserId, payload)`.
- `src/lib/payments/stripe.ts` — `createCustomer({email, name})` stub.

**Server actions:**
- `src/lib/accounts/actions.ts` — `saveClientProfile`, `saveOrganisationProfile` (insert profile + stub Stripe customer id).
- `src/lib/bookings/actions.ts` — `createBooking`, `acceptBooking`, `declineBooking`, `assignBooking`, `cancelBooking`. Each: Zod validate → `applyTransition` → write → `booking_status_history` → notify.

**Pages:**
- `src/app/client/register/page.tsx`, `src/app/organisation/register/page.tsx`
- `src/app/client/bookings/**`, `src/app/organisation/bookings/**` — list + `new` (request form) + cancel
- `src/app/professional/bookings/**` — open (role+eligibility, minus declined) / assigned / history; accept & decline
- `src/app/admin/bookings/**` — all bookings + assign picker (eligible pros) + cancel

## Data flow — the two matching paths

- **Open-market accept (concurrency-safe):** `acceptBooking(id)` issues a conditional update —
  `UPDATE bookings SET status='accepted', assigned_professional_id=…, accepted_at=now()
  WHERE id=$1 AND status='open' AND assigned_professional_id IS NULL`. 0 rows affected → "already
  taken" (race loser). The eligibility trigger fires on the assignment and hard-blocks ineligible pros.
- **Admin assign:** `assignBooking(bookingId, professionalId)` (service client) →
  `applyTransition('open','assign','admin')` → set assignment + `booking_type='admin_assigned'` →
  trigger enforces eligibility → history + `audit_log` + notify (requester + professional).

## Notifications

`sendNotification` loads the `notification_templates` row, renders `subject`/`body` via `{{var}}`
substitution, inserts a `notifications` row (`status='queued'`), hands off to an injected channel
sender, then updates `status`→`sent`/`failed` + `sent_at`. The `notifications` row is the durable
record; email is best-effort and never blocks the booking action. Channel senders: **Resend**
(prod, when `RESEND_API_KEY` set) and **local SMTP→Mailpit** (dev). Tests inject a fake sender.

| Event | Template | Recipient(s) |
|-------|----------|--------------|
| `createBooking` | `booking_request` | requester |
| `acceptBooking` / `assignBooking` | `booking_confirmation` | requester **and** assigned professional |
| `cancelBooking` | `booking_cancellation` *(new type)* | the other party |

Open-market discovery is **pull-based** (pros check the open list); no per-booking email blast.

## Stripe stub

`createCustomer({email, name})` returns `cus_stub_<uuid>` with no network call; stored in
`stripe_customer_id` on `private_clients`/`organisations` at registration. S3 replaces the body
with the real Stripe SDK call behind the same signature.

## Migrations (next number is 0022)

- `0022_booking_eligibility_trigger.sql` — `enforce_booking_eligibility()` + `before insert/update of
  assigned_professional_id` trigger: raise unless the professional `can_accept_bookings` and role
  matches `professional_role_id`.
- `0023_booking_declines.sql` — `booking_declines` (`id`, `booking_id`, `professional_id`, `reason`,
  `declined_at`) + RLS (pro manages own) + read policy enabling the open-market `LEFT JOIN … WHERE
  decline IS NULL`.
- `0024_booking_cancellation_template.sql` — extend the `notification_templates.type` CHECK with
  `booking_cancellation` and seed the template.
- `seed.sql` append — ≥1 effective-dated `rate_cards` row per role so creation resolves a snapshot.

## Test strategy

- **Vitest:** `snapshot`, `create`, `eligibility`, `transitions` (every legal edge passes, illegal
  edges rejected), `accounts` schemas, `notifications/send` (render + status with fake sender).
- **pgTAP:** eligibility trigger raises for ineligible / role-mismatch; conditional-accept proof
  (second accept on a non-`open` booking is a no-op); `booking_declines` RLS isolation.
- **Playwright (`e2e/bookings.spec.ts`):** (1) client creates → pro accepts → assert `accepted` +
  frozen totals; (2) admin assigns eligible pro; (3) negative: ineligible pro blocked at accept;
  (4) decline removes the booking from that pro's open list; (5) cancel `< 24h` sets `is_last_minute`.

## Acceptance

Both matching paths work; rate snapshot frozen on the booking; ineligible pros blocked at
accept/assign (DB-enforced); concurrent accepts yield exactly one winner; declines hide per-pro;
cancellations recorded with the last-minute flag; notification rows created for
create/accept/assign/cancel; client/org receive a stub Stripe customer id.

## Out of scope (S3)

Payment capture, payouts, completion/`in_progress`/`no_show` transitions (table-defined, not
wired), admin rate-card editor, suspension workflow, location/availability matching, recurring
bookings.
