alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded','password_reset'));

insert into notification_templates (type, subject, body) values
  ('payment_receipt','Payment received','We have received your payment for booking {{booking_id}}.'),
  ('payout_recorded','Payout recorded','A payout of {{amount}} has been recorded for booking {{booking_id}}.')
on conflict (type) do nothing;

-- Hardening (from code review): one payment row per Stripe PaymentIntent, so webhook
-- reconciliation by intent id matches at most one row.
create unique index if not exists idx_payments_intent
  on payments(stripe_payment_intent_id) where stripe_payment_intent_id is not null;
