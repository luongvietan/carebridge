-- Guarantee the core notification templates exist on every environment. They
-- were previously defined only in seed.sql, which is NOT applied to hosted
-- databases, so on hosted sendNotification() found no template and silently
-- sent nothing for registration, assessment, compliance, booking and reminder
-- emails. Idempotent: existing rows (e.g. from the local seed) are left as-is.
insert into notification_templates (type, subject, body) values
  ('registration_confirmation','Welcome to CareBridge Connect','Your registration has been received.'),
  ('email_verification','Verify your email','Please verify your email address.'),
  ('assessment_result','Your assessment result','Your competency assessment result is available.'),
  ('compliance_approval','Compliance approved','Your compliance documents have been approved.'),
  ('compliance_expiry_reminder','Document expiring soon','A compliance document is due to expire. Please upload an updated certificate.'),
  ('booking_request','Booking request received','Your booking request ({{booking_id}}) has been submitted.'),
  ('booking_confirmation','Booking confirmed','Your booking has been confirmed.'),
  ('password_reset','Reset your password','Use the link to reset your password.')
on conflict (type) do nothing;
