-- Audit v4 §16: the payments export omitted refund data, so an exported payment
-- showed its full gross amount as 'succeeded' even after a partial refund and
-- could not be reconciled against the (refund-aware) finance dashboard. Add the
-- refund columns at the end of the view. CREATE OR REPLACE can reset view
-- options, so re-assert the 0049 lockdown (security_invoker + revoke) afterwards.
create or replace view v_export_payments as
select pay.id, pay.booking_id, pay.amount, pay.currency, pay.status, pay.paid_at, pay.created_at,
       pay.refunded_amount, pay.refunded_at
from payments pay;

alter view public.v_export_payments set (security_invoker = true);
revoke all on public.v_export_payments from anon, authenticated;
