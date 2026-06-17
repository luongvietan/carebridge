-- Notify professionals when a booking matching their role becomes available
-- (spec item 7: professionals "receive booking notifications"). booking_request
-- goes to the requester; this new type goes to eligible professionals.

alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded',
    'booking_available','password_reset'));

insert into notification_templates (type, subject, body) values
  ('booking_available','New booking available',
   'A booking ({{booking_id}}) matching your role is now available to accept.')
on conflict (type) do nothing;
