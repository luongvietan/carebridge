create type account_type as enum ('professional','private_client','organisation','admin');

create type employment_status as enum
  ('nhs_employed','private_sector_employed','self_employed','not_employed_in_healthcare');

create type professional_status as enum
  ('pending_verification','active','compliance_hold','booking_restricted',
   'temporarily_suspended','under_investigation','rejected','removed');

create type compliance_status as enum
  ('pending_review','approved','rejected','compliance_expired','further_info_required');

create type document_status as enum
  ('pending_review','approved','rejected','expired','further_info_required');

create type booking_status as enum
  ('open','assigned','accepted','confirmed','in_progress','completed','cancelled','no_show');

create type payment_status as enum
  ('pending','requires_action','succeeded','failed','refunded');

create type payout_status as enum ('pending','recorded','paid');

create type assessment_topic as enum
  ('safeguarding','infection_prevention_control','gdpr_confidentiality','professional_boundaries',
   'documentation_record_keeping','medication_awareness','health_safety','role_specific');
