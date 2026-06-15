-- Add the booking_cancellation template type, then seed the template row.
alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','password_reset'));

insert into notification_templates (type, subject, body) values
  ('booking_cancellation','Booking cancelled','A booking ({{booking_id}}) has been cancelled.')
on conflict (type) do nothing;
