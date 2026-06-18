-- Spec §8: a *partial* refund must not freeze the whole payout. The webhook
-- previously mapped every `charge.refunded` event to status='refunded' +
-- refunded_at, which blocked the professional's payout even when only part of
-- the charge was refunded. Record the cumulative refunded amount so a partial
-- refund can be tracked without flipping the payment to fully refunded.
alter table payments
  add column if not exists refunded_amount numeric(10,2);
