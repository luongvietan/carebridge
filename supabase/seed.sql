insert into professional_roles (code, name) values
  ('registered_nurse','Registered Nurse'),
  ('healthcare_assistant','Healthcare Assistant'),
  ('support_worker','Support Worker'),
  ('physiotherapist','Physiotherapist')
on conflict (code) do nothing;

insert into mandatory_training_types (code, name) values
  ('safeguarding_adults','Safeguarding Adults'),
  ('safeguarding_children','Safeguarding Children'),
  ('basic_life_support','Basic Life Support'),
  ('infection_prevention_control','Infection Prevention & Control'),
  ('health_safety','Health & Safety'),
  ('moving_handling','Moving & Handling'),
  ('gdpr_confidentiality','GDPR & Confidentiality')
on conflict (code) do nothing;

insert into document_types (code, name, category, is_compliance_critical, has_expiry) values
  ('photo_id','Photo ID','identity', false, true),
  ('right_to_work','Right to Work','right_to_work', true, true),
  ('enhanced_dbs','Enhanced DBS Certificate','dbs', true, true),
  ('dbs_update_service','DBS Update Service','dbs', false, false),
  ('professional_registration','Professional Registration (NMC/HCPC)','registration', true, true),
  ('qualification','Qualification','qualification', false, false),
  ('mandatory_training_certificate','Mandatory Training Certificate','training', true, true),
  ('professional_reference','Professional Reference','reference', false, false),
  ('professional_indemnity_insurance','Professional Indemnity Insurance','insurance', true, true),
  ('bank_details','Bank Details','bank', false, false)
on conflict (code) do nothing;

insert into notification_templates (type, subject, body) values
  ('registration_confirmation','Welcome to CareBridge Connect','Your registration has been received.'),
  ('email_verification','Verify your email','Please verify your email address.'),
  ('assessment_result','Your assessment result','Your competency assessment result is available.'),
  ('compliance_approval','Compliance approved','Your compliance documents have been approved.'),
  ('compliance_expiry_reminder','Document expiring soon','A compliance document is due to expire.'),
  ('booking_request','New booking request','A booking matching your role is available.'),
  ('booking_confirmation','Booking confirmed','Your booking has been confirmed.'),
  ('password_reset','Reset your password','Use the link to reset your password.')
on conflict (type) do nothing;
