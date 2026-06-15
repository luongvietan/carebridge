# S3a — Payments & Payouts — Design

> Date: 2026-06-15. First half of the client-facing **Phase 4** (the original S3 split into
> **S3a Payments & Payouts** and **S3b Admin Dashboard & Governance**; this spec covers S3a).
> Builds on S0–S2 + the DB layer. Supersedes the payments/payout portions of the 2026-06-14
> S3 plan, whose migration numbering and payment-timing assumptions are stale.

## Goal

Collect the client charge via Stripe once a booking is staffed, reconcile payments by webhook,
let admins refund in-app, record professional payouts (not auto-disbursed) with encrypted bank
details, and report platform revenue.

## Scope

**In:** booking completion lifecycle wiring; Stripe Checkout collection + webhook reconciliation;
in-app admin refunds; professional bank details (pgcrypto-encrypted) + admin payout recording;
finance/revenue report; payment/payout notifications.

**Out (→ S3b):** admin user management, suspension/status workflow, central rate-card management,
professional search/filter.

## Locked decisions

- **Charge timing:** after staffing — client pays once a professional is `accepted`/`assigned`.
- **Method:** Stripe **Checkout** (hosted); SCA handled by Stripe; on-session.
- **Completion:** the assigned **professional** marks the shift completed; **admin can override**. Both audited.
- **Refunds:** **in-app admin refund** (Stripe refund call; webhook reconciles to `refunded`).
- **Payouts:** **recorded, not auto-disbursed** (MVP-locked); bank details encrypted at rest (pgcrypto).
- **Payout gate:** recordable only when booking `status='completed'` AND its payment is `succeeded`.

## Money lifecycle & state machine

The S2 state machine defined `confirmed`/`in_progress`/`completed`/`no_show` but left them unwired.
S3a wires only what the money flow needs; the intermediate states stay defined-but-unused (YAGNI).

```
open → accepted (open-market) / assigned (admin)        "staffed"
        ├─ client pays (Stripe Checkout) → payment.succeeded
        ├─ complete  (professional, admin override) → completed → payout recordable
        ├─ no_show   (admin)                        → no_show
        └─ cancel    (existing S2 rule)             → cancelled → (admin refund if paid)
```

**`lib/bookings/transitions.ts` changes:** add `complete` edges from **`accepted`** and **`assigned`**
(actors: professional, admin). `no_show` from accepted/assigned (admin) already exists.
`confirm`/`start` and the `confirmed`/`in_progress` states remain defined but unwired.

**Rules:** payment is requested at staffing but is **not** a hard gate on the shift; it gates payout.
Completion never auto-triggers payout — admins record payouts deliberately.

## Stripe integration

**Module consolidation:** the S2 stub `lib/payments/stripe.ts` (`createCustomer`) is replaced by a
single `src/lib/stripe/` module. The `stripe` SDK is installed; `createCustomer` becomes a real
call (client/org registration then creates a true Stripe customer); `accounts/actions.ts` import
is updated.

**Files:**
- `src/lib/stripe/client.ts` — configured Stripe instance from `STRIPE_SECRET_KEY` (+ real `createCustomer`).
- `src/lib/stripe/checkout.ts` — pure `buildCheckoutLineItems(booking)`: amount in pence =
  `round(total_client_charge * 100)`, currency, `metadata: { booking_id, payment_id }`. (+Vitest)
- `src/lib/payments/actions.ts` — `startCheckout(bookingId)` (requester), `refundPayment(paymentId)` (admin).
- `src/app/api/stripe/webhook/route.ts` — signature-verified webhook (service client).

**Pay flow:** on the requester's staffed booking, a "Pay now" action calls `startCheckout(bookingId)`:
verify the caller owns the booking and it's `accepted`/`assigned`; upsert a `payments` row
(`status='pending'`, `amount=total_client_charge`, `payer_user_id`); create a Stripe Checkout Session
(mode `payment`, line item, `success_url`/`cancel_url`, metadata + `payment_intent_data.metadata`);
persist the session/intent id on the row; return the URL for redirect.

**Webhook:** read the **raw body** (`await req.text()`), verify against `STRIPE_WEBHOOK_SECRET`.
Handle `checkout.session.completed` / `payment_intent.succeeded` → `payments.status='succeeded'`, `paid_at`;
`payment_intent.payment_failed` → `failed`; `charge.refunded` → `refunded`. **Idempotent:** match the row
by `stripe_payment_intent_id`, ignore if already in the target state. Each reconciliation writes `audit_log`.

**Refund:** `refundPayment(paymentId)` (admin) calls `stripe.refunds.create({ payment_intent })`; the
`charge.refunded` webhook is the source of truth that flips the row to `refunded`. Action writes `audit_log`.

**Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`. Test mode for build; live at launch.

## Payouts

**Bank details (encrypt-at-rest):** migration adds SQL helpers (pgcrypto already enabled):
`set_payout_details(professional_id, account_name, sort_code, account_number, key)` →
`pgp_sym_encrypt` into `sort_code_enc`/`account_number_enc` (bytea), stores `account_number_last4`;
`get_payout_last4(professional_id)`. The symmetric key comes from `PAYOUT_ENC_KEY` env, passed per
call by the action, **never stored**. Professional page `professional/payout-details` +
`savePayoutDetails` action (service client). The app only ever shows the last 4.

**Recording (admin):**
- Pure `src/lib/payouts/record.ts` — `nextPayoutStatus(current, action)`: `pending → recorded → paid`;
  illegal transitions throw. (+Vitest)
- `src/lib/admin/payout-actions.ts` — `recordPayout(bookingId)` (gated on `completed` + payment `succeeded`):
  insert a `payouts` row (`amount = total_payout`, `recorded_by`, `recorded_at`); `markPayoutPaid(payoutId,
  method, reference)` → `status='paid'`, `paid_at`. Both write `audit_log`.
- Admin page `admin/finance/payouts` — completed+paid bookings awaiting payout; record / mark-paid controls;
  professional bank last-4.

## Finance & revenue report (`admin/finance`)

Transaction history (`payments` + `payouts` joined to bookings), date-filterable. Platform revenue from
`v_platform_revenue`, **summed over bookings with a `succeeded` payment** (the raw view spans all bookings
regardless of payment, so the report filters to paid to avoid counting unrealized revenue). Headline
figures: total collected, total paid out, platform fee (revenue).

## Notifications

Add `payment_receipt` and `payout_recorded` template types (small enum-extension migration, like S2's
`booking_cancellation`); send via the existing adapter — client receipt on `succeeded`, professional notice
when a payout is recorded.

## Migrations (next number is 0026; pgTAP test next is 0027)

- `0026_payout_crypto_fns.sql` — `set_payout_details` / `get_payout_last4` → pgTAP `0027_payout_crypto_test.sql`.
- `0027_payment_notification_templates.sql` — extend `notification_templates.type` CHECK with
  `payment_receipt`, `payout_recorded` + seed the rows.
- No new tables (`payments`, `payouts`, `professional_payout_details` already exist).

## Test strategy

- **Vitest:** `stripe/checkout` (pence/currency/metadata), `payouts/record` (transitions + illegal throws),
  `transitions` (new `complete` edges), webhook event→status mapping helper.
- **pgTAP:** payout-crypto round-trip (decrypt returns original; `last4` stored).
- **Playwright (Stripe mocked):** staffed booking → `startCheckout` returns a session (mock) → POST a
  locally-signed `payment_intent.succeeded` to the webhook → `payments.status='succeeded'`; professional
  marks `completed`; admin records payout → `payouts` row + revenue reflects the fee; refund path: cancel a
  paid booking → admin refund → row `refunded`. Stripe in test mode; no live calls.

## Acceptance

Client pays the charge via Checkout once staffed; webhook reconciles `payments` idempotently; a
completed+paid booking's payout is recordable (amount = `total_payout`) with encrypted bank details and a
pending→recorded→paid trail; paid+cancelled bookings refundable in-app; revenue report sums platform fee
over paid bookings; every money action audited.
