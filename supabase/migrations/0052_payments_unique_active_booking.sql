-- Spec §8: prevent a booking being charged twice. `startCheckout` did a
-- non-atomic check-then-insert and `payments` had only a non-unique index on
-- booking_id, so two concurrent "Pay now" clicks could each insert a pending
-- payment and open a separate Stripe Checkout session for the same booking.
--
-- Enforce at most one *active* (pending or succeeded) payment per booking. A
-- failed or refunded payment does not block starting a fresh one.
create unique index if not exists uq_payments_active_booking
  on payments(booking_id)
  where status in ('pending', 'succeeded');
