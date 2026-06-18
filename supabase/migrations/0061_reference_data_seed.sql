-- Audit v4 §4/§13: the lookup/reference data the platform cannot run without —
-- professional roles, mandatory training types, document types and the per-role
-- compliance requirements — lived ONLY in supabase/seed.sql, which is NOT applied
-- to hosted/production databases (see migration 0039, which moved notification
-- templates here for the same reason). A clean deploy from migrations alone would
-- have zero document types → no upload slots → isCompliant() vacuously true →
-- every applicant activatable with no documents. Move the reference data into an
-- idempotent migration so every environment is functional and the handover is
-- reproducible. (Test users, sample documents and the PLACEHOLDER question bank
-- remain in seed.sql — they are dev fixtures / pending Ana's real content.)

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
