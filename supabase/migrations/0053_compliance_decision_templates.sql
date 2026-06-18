-- Spec §9 ("Request additional information") + §10 + §16: when an admin rejects
-- a compliance document or asks for further information, the professional must
-- be notified. Previously only the approval path sent a notification, and no
-- template existed for the rejected / further-info outcomes.

-- notification_templates.type is CHECK-constrained to the known set; widen it to
-- admit the two new compliance-decision templates (carrying the full existing
-- set from migration 0045 forward).
alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded',
    'booking_available','compliance_rejected','further_info_required','password_reset'));

insert into notification_templates (type, subject, body) values
  ('compliance_rejected',
   'A compliance document was not accepted',
   'One of your compliance documents was not accepted. Reason: {{reason}}. Please sign in and upload an updated document so your application can proceed.'),
  ('further_info_required',
   'Further information needed on your compliance documents',
   'We need further information about one of your compliance documents. {{reason}} Please sign in to review and update your documents.')
on conflict (type) do nothing;

-- The expiry-reminder email collected a due date but the body never showed it,
-- so professionals were told a document was expiring without saying when.
update notification_templates
  set body = 'A compliance document is due to expire on {{due_date}}. Please sign in and upload an updated certificate before it lapses, or your ability to accept bookings will be restricted.'
  where type = 'compliance_expiry_reminder';

-- The assessment-result email is handed the score + outcome but never showed
-- them, forcing the applicant to sign in to learn whether they passed.
update notification_templates
  set body = 'Your competency assessment has been scored: {{score}}%. Result: {{passed}}. Sign in to view your full result and next steps.'
  where type = 'assessment_result';
