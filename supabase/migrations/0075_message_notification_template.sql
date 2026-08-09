alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded',
    'booking_available','compliance_rejected','further_info_required','password_reset',
    'professional_rejected','account_removed','professional_suspended',
    'timesheet_submitted','timesheet_confirmed','timesheet_disputed',
    'message_received'));

insert into notification_templates (type, subject, body) values
  ('message_received','You have a new message on CareBridge Connect',
   'You have a new message about "{{subject}}". Sign in to read and reply.')
on conflict (type) do nothing;
