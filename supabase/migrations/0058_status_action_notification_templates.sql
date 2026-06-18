-- Audit v3 §9/§10: applying a professional-level status action (reject / remove /
-- suspend / restrict) wrote the status row + audit_log but never NOTIFIED the
-- professional. Only document-level compliance decisions (0053) emailed. A
-- rejected or removed professional learned of it only by being locked out.
--
-- Add the templates and widen the type CHECK (carrying forward the full set from
-- 0053). The notification send call lives in lib/admin/status-actions.ts.

alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded',
    'booking_available','compliance_rejected','further_info_required','password_reset',
    'professional_rejected','account_removed','professional_suspended'));

insert into notification_templates (type, subject, body) values
  ('professional_rejected',
   'Your CareBridge Connect application was not approved',
   'Your application has not been approved at this time. Reason: {{reason}}. If you believe this is in error, please contact CareBridge Connect.'),
  ('account_removed',
   'Your CareBridge Connect account has been removed',
   'Your professional account has been removed. Reason: {{reason}}. Please contact CareBridge Connect if you have any questions.'),
  ('professional_suspended',
   'A restriction has been applied to your CareBridge Connect account',
   'A restriction ({{action}}) has been applied to your account. Reason: {{reason}}. While this is in place you can still view available bookings but cannot accept new ones. Please contact CareBridge Connect for details.')
on conflict (type) do nothing;
