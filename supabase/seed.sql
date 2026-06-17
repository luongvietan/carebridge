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
  ('00000000-0000-0000-0000-0000000a0008', null, 'role_specific', 'If a task is outside your competence or scope you should:', '[{"key":"a","text":"Attempt it anyway"},{"key":"b","text":"Decline and escalate to an appropriate professional"},{"key":"c","text":"Guess"},{"key":"d","text":"Delegate to a client"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0009', null, 'safeguarding', 'Who has a responsibility to safeguard vulnerable adults and children?', '[{"key":"a","text":"Only the safeguarding lead"},{"key":"b","text":"Only managers"},{"key":"c","text":"Everyone working with them"},{"key":"d","text":"Only social workers"}]', 'c'),
  ('00000000-0000-0000-0000-0000000a0010', null, 'infection_prevention_control', 'When should hand hygiene be performed?', '[{"key":"a","text":"Only after a shift"},{"key":"b","text":"Before and after every patient contact"},{"key":"c","text":"Only when hands look dirty"},{"key":"d","text":"Once a day"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0011', null, 'gdpr_confidentiality', 'A colleague asks about a patient who is their neighbour. You should:', '[{"key":"a","text":"Share the details"},{"key":"b","text":"Only confirm the diagnosis"},{"key":"c","text":"Decline — there is no legitimate care reason"},{"key":"d","text":"Ask the patient later"}]', 'c'),
  ('00000000-0000-0000-0000-0000000a0012', null, 'professional_boundaries', 'A client asks to add you on social media. The appropriate response is:', '[{"key":"a","text":"Accept to be friendly"},{"key":"b","text":"Politely decline to maintain professional boundaries"},{"key":"c","text":"Accept but restrict your profile"},{"key":"d","text":"Ignore and block them"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0013', null, 'documentation_record_keeping', 'If you make an error in a paper record you should:', '[{"key":"a","text":"Use correction fluid"},{"key":"b","text":"Score it out, initial and date the correction"},{"key":"c","text":"Rewrite the whole page"},{"key":"d","text":"Leave it"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0014', null, 'medication_awareness', 'If you are unsure about a medication dose you should:', '[{"key":"a","text":"Estimate it"},{"key":"b","text":"Give half to be safe"},{"key":"c","text":"Check with a qualified prescriber/pharmacist before administering"},{"key":"d","text":"Skip the dose without telling anyone"}]', 'c'),
  ('00000000-0000-0000-0000-0000000a0015', null, 'health_safety', 'Before moving and handling a patient you should first:', '[{"key":"a","text":"Lift quickly to save time"},{"key":"b","text":"Carry out a risk assessment and use appropriate equipment"},{"key":"c","text":"Ask the patient to manage alone"},{"key":"d","text":"Move them without aids"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0016', null, 'role_specific', 'You notice a colleague practising unsafely. You should:', '[{"key":"a","text":"Say nothing"},{"key":"b","text":"Raise the concern through the appropriate channel"},{"key":"c","text":"Confront them publicly"},{"key":"d","text":"Wait until something goes wrong"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0017', null, 'safeguarding', 'A capacitated adult discloses abuse but asks you to keep it secret. You should:', '[{"key":"a","text":"Promise to keep it secret"},{"key":"b","text":"Explain you may need to share it to keep them or others safe"},{"key":"c","text":"Forget the conversation"},{"key":"d","text":"Tell their family"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0018', null, 'infection_prevention_control', 'Used sharps should be disposed of in:', '[{"key":"a","text":"The general waste bin"},{"key":"b","text":"A sealed sharps container"},{"key":"c","text":"A recycling bin"},{"key":"d","text":"Your pocket until later"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0019', null, 'gdpr_confidentiality', 'Under GDPR, individuals have the right to:', '[{"key":"a","text":"Never be recorded"},{"key":"b","text":"Access the personal data held about them"},{"key":"c","text":"Demand other patients'' data"},{"key":"d","text":"Avoid all treatment records"}]', 'b'),
  ('00000000-0000-0000-0000-0000000a0020', null, 'health_safety', 'The correct order for putting on PPE generally starts with:', '[{"key":"a","text":"Gloves"},{"key":"b","text":"Apron/gown"},{"key":"c","text":"Eye protection"},{"key":"d","text":"Mask last"}]', 'b')
on conflict (id) do nothing;

-- Required documents per role: the critical documents + photo ID, plus the
-- remaining supporting uploads (qualifications, references, DBS update service).
-- Bank details are collected via the encrypted payout-details form, not here.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
from professional_roles r
join document_types d on d.code in
  ('photo_id','right_to_work','enhanced_dbs','professional_registration',
   'mandatory_training_certificate','professional_indemnity_insurance',
   'qualification','professional_reference','dbs_update_service')
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

-- For local Supabase development, test auth users are created with bcrypt-hashed passwords.
-- Password for all test users: password123
--
-- AUTHENTICATION APPROACH FOR LOCAL DEVELOPMENT:
-- Supabase local development (supabase start) includes GoTrue, but it has limitations
-- when seeding passwords directly to auth.users. The standard approach is:
--
-- 1. Seed auth.users with bcrypt-hashed passwords (done here)
-- 2. Use the helper script: node setup_test_users.mjs
--
-- This ensures users exist in the system and can authenticate locally.
-- The setup script uses the Supabase Admin API to properly configure auth.
--
-- For production, all user creation goes through Supabase's cloud auth service.

DO $$
DECLARE
  v_password_hash text;
BEGIN
  -- Generate bcrypt hash for all test users
  -- Password: password123
  v_password_hash := crypt('password123', gen_salt('bf'));

  -- Insert test users into auth.users with:
  -- - Bcrypt-hashed passwords (verified via crypt() in PostgreSQL)
  -- - email_confirmed_at set so users can immediately log in
  -- - authenticated role for API access
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'prof@example.com', v_password_hash, now(), now(), now(), 'authenticated', '{"account_type":"professional"}'::jsonb, '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'client@example.com', v_password_hash, now(), now(), now(), 'authenticated', '{"account_type":"private_client"}'::jsonb, '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'org@example.com', v_password_hash, now(), now(), now(), 'authenticated', '{"account_type":"organisation"}'::jsonb, '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'admin@example.com', v_password_hash, now(), now(), now(), 'authenticated', '{"account_type":"admin"}'::jsonb, '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- This trigger will create corresponding public.users entries
  RAISE NOTICE 'Test users inserted into auth.users';
  RAISE NOTICE 'Email: prof@example.com, client@example.com, org@example.com, admin@example.com';
  RAISE NOTICE 'Password: password123';
END $$;

-- Then insert corresponding entries in public.users
INSERT INTO users (id, email, account_type, is_founder, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'prof@example.com', 'professional', false, true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'client@example.com', 'private_client', false, true, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'org@example.com', 'organisation', false, true, now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'admin@example.com', 'admin', true, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert professional profile for Professional user
INSERT INTO professionals (user_id, full_name, professional_role_id, employment_status, professional_status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Jane Smith',
   (SELECT id FROM professional_roles WHERE code = 'registered_nurse' LIMIT 1),
   'nhs_employed', 'active', now(), now())
ON CONFLICT (user_id) DO NOTHING;


-- Insert compliance documents for Professional (sample: DBS verified, NMC verified, training pending).
-- These document types carry an expiry, so an in-date expiry_date is required (migration 0041).
INSERT INTO documents (professional_id, document_type_id, storage_path, original_filename, verification_status, verified_at, expiry_date, created_at, updated_at) VALUES
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM document_types WHERE code = 'enhanced_dbs' LIMIT 1),
   'professional_documents/dbs_jane_smith_001.pdf', 'dbs_jane_smith_001.pdf', 'approved', now() - INTERVAL '30 days', current_date + 330, now(), now()),
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM document_types WHERE code = 'professional_registration' LIMIT 1),
   'professional_documents/nmc_jane_smith_001.pdf', 'nmc_jane_smith_001.pdf', 'approved', now() - INTERVAL '60 days', current_date + 300, now(), now()),
  ((SELECT id FROM professionals WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
   (SELECT id FROM document_types WHERE code = 'mandatory_training_certificate' LIMIT 1),
   'professional_documents/training_jane_smith_001.pdf', 'training_jane_smith_001.pdf', 'pending_review', NULL, current_date + 365, now(), now())
ON CONFLICT DO NOTHING;

-- Insert private client profile
INSERT INTO private_clients (user_id, full_name, address_line1, city, postcode, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000002', 'John Brown',
   '42 Oak Street', 'London', 'SW1A 1AA',
   now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert organisation profile
INSERT INTO organisations (user_id, organisation_name, address_line1, city, postcode, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Sunnyhill Care Ltd',
   '100 High Street', 'London', 'E1 6AA',
   now(), now())
ON CONFLICT (user_id) DO NOTHING;

