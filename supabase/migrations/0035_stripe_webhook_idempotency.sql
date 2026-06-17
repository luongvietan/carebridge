-- Stripe webhook idempotency + refund state preservation.
-- The webhook handler previously gated reconciliation only on
-- `payment.status === eventStatus` equality. Stripe documents that webhooks
-- are redelivered and may arrive out of order, so a stale `payment_intent.succeeded`
-- arriving after a `charge.refunded` would flip status back to succeeded and
-- unlock the payout flow. We fix this in two ways:
--
-- 1. A `stripe_webhook_events` table keyed on event.id provides exactly-once
--    processing — a unique-constraint violation on insert means "already handled".
-- 2. A `refunded_at` column on `payments` preserves refund state independently
--    of `status`, so even if a future event arrives the payout gate can refuse
--    bookings that have ever been refunded.

create table if not exists stripe_webhook_events (
  event_id      text primary key,
  event_type    text not null,
  payment_id    uuid references payments(id),
  received_at   timestamptz not null default now()
);
alter table stripe_webhook_events enable row level security;
-- Only the service role inserts here; no public policy intentionally.

alter table payments
  add column if not exists refunded_at timestamptz;
