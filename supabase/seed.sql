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

-- PLACEHOLDER competency questions (role_id NULL = applies to all roles).
-- Replace with Ana's real per-role question bank when delivered. Fixed UUIDs keep the seed idempotent.
insert into assessment_question_bank (id, professional_role_id, topic, question_text, options, correct_option) values
  ('00000000-0000-0000-0000-0000000a0001', null, 'safeguarding', 'If you suspect an adult is at risk of abuse, you should:', '[{"key":"a","text":"Ignore it unless asked"},{"key":"b","text":"Report it to the safeguarding lead promptly"},{"key":"c","text":"Confront the alleged abuser yourself"},{"key":"d","text":"Wait until your next shift"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0002', null, 'infection_prevention_control', 'The most effective routine measure to prevent cross-infection is:', '[{"key":"a","text":"Wearing gloves at all times"},{"key":"b","text":"Hand hygiene"},{"key":"c","text":"Opening windows"},{"key":"d","text":"Avoiding patients"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0003', null, 'gdpr_confidentiality', 'Patient records should be shared:', '[{"key":"a","text":"Freely with colleagues"},{"key":"b","text":"On social media if anonymised"},{"key":"c","text":"Only on a lawful, need-to-know basis"},{"key":"d","text":"With family on request"}]', 'c'),
  ('00000000-0000-0000-0000-0000000a0004', null, 'professional_boundaries', 'Accepting a large personal gift from a client is:', '[{"key":"a","text":"Always fine"},{"key":"b","text":"A boundary concern to be declared/declined"},{"key":"c","text":"Encouraged"},{"key":"d","text":"Required"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0005', null, 'documentation_record_keeping', 'Good clinical records should be:', '[{"key":"a","text":"Written days later"},{"key":"b","text":"Accurate, contemporaneous and legible"},{"key":"c","text":"Kept only in your memory"},{"key":"d","text":"Vague to save time"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0006', null, 'medication_awareness', 'Before administering medication you must check:', '[{"key":"a","text":"Only the drug name"},{"key":"b","text":"The right patient, drug, dose, route and time"},{"key":"c","text":"Nothing if you are in a hurry"},{"key":"d","text":"The expiry date only"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0007', null, 'health_safety', 'When you spot a workplace hazard you should:', '[{"key":"a","text":"Step over it"},{"key":"b","text":"Report and, if safe, mitigate it"},{"key":"c","text":"Wait for someone else"},{"key":"d","text":"Leave for the day"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0008', null, 'role_specific', 'If a task is outside your competence or scope you should:', '[{"key":"a","text":"Attempt it anyway"},{"key":"b","text":"Decline and escalate to an appropriate professional"},{"key":"c","text":"Guess"},{"key":"d","text":"Delegate to a client"}]', 'b')
on conflict (id) do nothing;

-- Required documents per role: every role must provide the key critical documents + photo ID.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
from professional_roles r
join document_types d on d.code in
  ('photo_id','right_to_work','enhanced_dbs','professional_registration',
   'mandatory_training_certificate','professional_indemnity_insurance')
on conflict (professional_role_id, document_type_id) do nothing;

-- One active, effective-dated rate card per role so booking creation can resolve a snapshot.
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, platform_fee_type, currency)
select r.id, 40.00, 28.00, 'derived', 'GBP'
from professional_roles r
where not exists (
  select 1 from rate_cards rc where rc.professional_role_id = r.id and rc.effective_to is null
);

-- Fix booking_request copy: sent to the requester on create, not to professionals.
update notification_templates
   set body = 'Your booking request ({{booking_id}}) has been submitted.'
 where type = 'booking_request';

-- ============================================================================
-- TEST USERS FOR USER FLOW SCREENSHOTS
-- ============================================================================

-- Insert test users into public.users table directly
-- (In local Supabase, we bypass auth.users for demo purposes)

INSERT INTO users (id, email, account_type, is_founder, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'prof@example.com', 'professional', false, true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'client@example.com', 'private_client', false, true, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'org@example.com', 'organisation', false, true, now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'admin@example.com', 'admin', true, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert professional profile for Professional user
INSERT INTO professionals (user_id, display_name, professional_role_id, years_of_experience, employment_status, professional_status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Jane Smith',
   (SELECT id FROM professional_roles WHERE code = 'registered_nurse' LIMIT 1),
   15, 'nhs_employed', 'active', now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert professional rate card
INSERT INTO professional_rate_cards (professional_id, effective_from, base_rate_hourly, currency, is_active, created_at, updated_at) VALUES
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   CURRENT_DATE, 22.50, 'GBP', true, now(), now())
ON CONFLICT DO NOTHING;

-- Insert compliance documents for Professional (sample: DBS verified, NMC verified, training pending)
INSERT INTO professional_documents (professional_id, document_type_id, document_status, file_reference, verified_at, created_at, updated_at) VALUES
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM document_types WHERE code = 'enhanced_dbs' LIMIT 1),
   'approved', 'dbs_jane_smith_001.pdf', now() - INTERVAL '30 days', now(), now()),
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM document_types WHERE code = 'professional_registration' LIMIT 1),
   'approved', 'nmc_jane_smith_001.pdf', now() - INTERVAL '60 days', now(), now()),
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM document_types WHERE code = 'mandatory_training_certificate' LIMIT 1),
   'pending_review', 'training_jane_smith_001.pdf', NULL, now(), now())
ON CONFLICT DO NOTHING;

-- Insert private client profile
INSERT INTO private_clients (user_id, display_name, address_line_1, city, postcode, care_needs_description, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000002', 'John Brown',
   '42 Oak Street', 'London', 'SW1A 1AA',
   'Post-operative care, wound dressing, morning/evening assistance',
   now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert organisation profile
INSERT INTO organisations (user_id, organisation_name, address_line_1, city, postcode, organisation_type, total_bed_capacity, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Sunnyhill Care Ltd',
   '100 High Street', 'London', 'E1 6AA',
   'care_home', 50, now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample bookings for demo (Professional accepts one, Private Client has pending one, Org has managed one)
INSERT INTO bookings (professional_id, client_id, organisation_id, booking_status, start_time, duration_hours, created_at, updated_at) VALUES
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM private_clients WHERE user_id = '00000000-0000-0000-0000-000000000002' LIMIT 1),
   NULL,
   'accepted',
   now() + INTERVAL '2 days', 8, now(), now()),
  (NULL,
   (SELECT id FROM private_clients WHERE user_id = '00000000-0000-0000-0000-000000000002' LIMIT 1),
   NULL,
   'open',
   now() + INTERVAL '5 days', 6, now(), now())
ON CONFLICT DO NOTHING;
