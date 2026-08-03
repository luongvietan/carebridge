-- Childcare Professionals category (client request, 24 July 2026).
--
-- Adds a category tier above professional_roles so the marketplace can offer
-- Healthcare and Childcare side by side, plus the childcare-specific vetting the
-- client asked for: Ofsted-registered nannies only, with the registration number
-- mandatory at profile stage and verified before any booking can be accepted.
--
-- The Ofsted booking gate deliberately reuses the existing compliance engine
-- rather than altering professionals.can_accept_bookings (a stored generated
-- column). The Ofsted certificate is registered as a compliance-critical
-- document required for the nanny role, so isCompliant() cannot return true
-- until an administrator approves it, which in turn keeps compliance_status out
-- of 'approved' and can_accept_bookings false. A trigger adds a second,
-- independent guard on the registration number itself.

/* ------------------------------------------------------------ categories -- */

create table if not exists role_categories (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null,
  sort_order smallint not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

insert into role_categories (code, name, sort_order) values
  ('healthcare','Healthcare Professionals',1),
  ('childcare','Childcare Professionals',2)
on conflict (code) do nothing;

alter table professional_roles
  add column if not exists category_id uuid references role_categories(id);

-- Every pre-existing role is a healthcare role.
update professional_roles
   set category_id = (select id from role_categories where code = 'healthcare')
 where category_id is null;

insert into professional_roles (code, name, category_id)
select v.code, v.name, (select id from role_categories where code = 'childcare')
  from (values
    ('nanny','Nanny'),
    ('babysitter','Babysitter'),
    ('mothers_helper','Mother''s Helper')
  ) as v(code, name)
on conflict (code) do nothing;

-- Safe only after the backfill above has given every row a category.
alter table professional_roles alter column category_id set not null;

create index if not exists idx_roles_category on professional_roles(category_id);

/* ------------------------------------------------------------ care types -- */

-- The client listed "full-time & part-time nannies", "overnight nannies",
-- "emergency", "after-school" and "holiday" childcare. These are scheduling
-- scenarios rather than distinct professions, so they are booking options
-- against a role instead of roles in their own right. Keeping them out of
-- professional_roles preserves the strict role match between a booking and the
-- professional who accepts it (see 0022_booking_eligibility_trigger.sql).

create table if not exists care_types (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references role_categories(id),
  code        text unique not null,
  name        text not null,
  description text,
  sort_order  smallint not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into care_types (category_id, code, name, description, sort_order)
select (select id from role_categories where code = 'childcare'),
       v.code, v.name, v.description, v.sort_order
  from (values
    ('full_time',    'Full-time',           'Ongoing full-time care',                         1),
    ('part_time',    'Part-time',           'Ongoing care on agreed days or hours',           2),
    ('after_school', 'After-school care',   'Collection from school and care until evening',  3),
    ('overnight',    'Overnight',           'Care covering the night, including night wakes', 4),
    ('holiday',      'Holiday childcare',   'Cover during school holidays',                   5),
    ('emergency',    'Emergency childcare', 'Short-notice cover',                             6)
  ) as v(code, name, description, sort_order)
on conflict (code) do nothing;

create index if not exists idx_care_types_category on care_types(category_id);

alter table bookings
  add column if not exists care_type_id uuid references care_types(id);

create index if not exists idx_bookings_care_type on bookings(care_type_id);

-- A care type belongs to a category, so it must not be attached to a booking
-- for a role from a different category (e.g. "Overnight" on a physiotherapist).
create or replace function enforce_care_type_category()
returns trigger
language plpgsql
as $$
declare
  role_category uuid;
  care_category uuid;
begin
  if new.care_type_id is null then
    return new;
  end if;

  select r.category_id into role_category
    from professional_roles r
   where r.id = new.professional_role_id;

  select c.category_id into care_category
    from care_types c
   where c.id = new.care_type_id;

  if role_category is distinct from care_category then
    raise exception 'care type does not belong to the category of the booked role';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_care_type on bookings;
create trigger trg_bookings_care_type
  before insert or update of care_type_id, professional_role_id on bookings
  for each row execute function enforce_care_type_category();

/* ---------------------------------------------------------------- Ofsted -- */

alter table professionals
  add column if not exists ofsted_registration_number text;

comment on column professionals.ofsted_registration_number is
  'Ofsted registration number. Mandatory for the nanny role; verified by an administrator against the Ofsted register before activation.';

-- Independent of the document-approval gate: a nanny can never reach 'active'
-- without a registration number on file, whatever route sets the status.
create or replace function enforce_ofsted_for_nanny()
returns trigger
language plpgsql
as $$
declare
  role_code text;
begin
  if new.professional_status <> 'active' then
    return new;
  end if;

  select r.code into role_code
    from professional_roles r
   where r.id = new.professional_role_id;

  if role_code = 'nanny'
     and coalesce(btrim(new.ofsted_registration_number), '') = '' then
    raise exception
      'Ofsted registration number is required before a nanny can be activated';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prof_ofsted on professionals;
create trigger trg_prof_ofsted
  before insert or update on professionals
  for each row execute function enforce_ofsted_for_nanny();

/* ------------------------------------------------------- document types --- */

insert into document_types (code, name, category, is_compliance_critical, has_expiry) values
  ('ofsted_registration','Ofsted Registration Certificate','registration', true,  true),
  ('paediatric_first_aid','Paediatric First Aid Certificate','training',   true,  true)
on conflict (code) do nothing;

/* ------------------------------------------- childcare compliance rules --- */

-- Childcare roles take the shared safeguarding set but not the NMC/HCPC
-- professional registration, which is a healthcare regulator. Paediatric first
-- aid replaces it as a critical requirement.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join role_categories c on c.id = r.category_id and c.code = 'childcare'
  join document_types d on d.code in
    ('photo_id','right_to_work','enhanced_dbs','mandatory_training_certificate',
     'paediatric_first_aid','professional_indemnity_insurance',
     'qualification','professional_reference','dbs_update_service')
on conflict (professional_role_id, document_type_id) do nothing;

-- Ofsted registration is required for nannies only. Being compliance-critical,
-- this single row is what blocks an unverified nanny from accepting bookings.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join document_types d on d.code = 'ofsted_registration'
 where r.code = 'nanny'
on conflict (professional_role_id, document_type_id) do nothing;

/* -------------------------------------------------------------- rates ----- */

-- PLACEHOLDER rates so the childcare booking flow is functional end to end.
-- The client will set the real figures via /admin/rates, which supersedes these
-- forward-only (0029_amend_rate_card_fn.sql).
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, notes)
select r.id, v.charge, v.payout,
       'PLACEHOLDER — awaiting confirmed childcare rates from the client'
  from (values
    ('nanny',          18.00, 14.00),
    ('babysitter',     15.00, 12.00),
    ('mothers_helper', 13.00, 10.00)
  ) as v(code, charge, payout)
  join professional_roles r on r.code = v.code
 where not exists (
   select 1 from rate_cards rc
    where rc.professional_role_id = r.id and rc.effective_to is null
 );

/* ------------------------------------------------ assessment questions ---- */

-- PLACEHOLDER role-specific questions, matching the format and standard of the
-- existing bank, so childcare applicants sit a relevant assessment rather than
-- a purely clinical one. The client will supply the final wording.
insert into assessment_question_bank (professional_role_id, topic, question_text, options, correct_option)
select r.id, v.topic::assessment_topic, v.question_text, v.options::jsonb, v.correct_option
  from (values
    ('nanny','role_specific','A parent asks you to collect their child from school, but the child is not on your agreed list. You should:','[{"key":"a","text":"Collect the child anyway"},{"key":"b","text":"Confirm directly with the parent and the school before collecting"},{"key":"c","text":"Ask another parent to collect them"},{"key":"d","text":"Leave the child at school"}]','b'),
    ('nanny','safeguarding','A child in your care discloses that someone has hurt them. You should:','[{"key":"a","text":"Promise to keep it a secret"},{"key":"b","text":"Question the child in detail to establish the facts"},{"key":"c","text":"Listen, reassure, record what was said and report it without delay"},{"key":"d","text":"Wait to see if it happens again"}]','c'),
    ('nanny','role_specific','Ofsted registration for a nanny means:','[{"key":"a","text":"The nanny is employed by Ofsted"},{"key":"b","text":"The nanny has been checked and is registered on the Ofsted Childcare Register"},{"key":"c","text":"The nanny does not need a DBS check"},{"key":"d","text":"The nanny can work without insurance"}]','b'),
    ('nanny','health_safety','A child in your care has a suspected broken arm. Your first action is:','[{"key":"a","text":"Drive them yourself while holding the arm"},{"key":"b","text":"Keep them still and comfortable, seek urgent medical help and inform the parents"},{"key":"c","text":"Wait for the parents to come home"},{"key":"d","text":"Apply a bandage and continue the day"}]','b'),
    ('nanny','professional_boundaries','A parent regularly returns two hours later than agreed without notice. You should:','[{"key":"a","text":"Say nothing to avoid conflict"},{"key":"b","text":"Leave the child alone at the agreed finish time"},{"key":"c","text":"Raise it professionally with the parent and agree clear arrangements"},{"key":"d","text":"Post about it publicly"}]','c'),

    ('babysitter','role_specific','Before the parents leave for the evening you should always confirm:','[{"key":"a","text":"Only the time they will return"},{"key":"b","text":"Emergency contacts, allergies, medication, routines and house safety information"},{"key":"c","text":"The wifi password"},{"key":"d","text":"Nothing — you can text later"}]','b'),
    ('babysitter','safeguarding','While babysitting, an unexpected visitor asks to come in to see the children. You should:','[{"key":"a","text":"Let them in if they seem friendly"},{"key":"b","text":"Not admit them and contact the parents to verify"},{"key":"c","text":"Let them wait inside with the children"},{"key":"d","text":"Leave the children with them"}]','b'),
    ('babysitter','health_safety','A toddler starts choking and cannot cough or make a sound. You should:','[{"key":"a","text":"Give a drink of water"},{"key":"b","text":"Begin back blows and abdominal thrusts as trained, and call 999"},{"key":"c","text":"Wait to see if it clears"},{"key":"d","text":"Put them to bed"}]','b'),
    ('babysitter','professional_boundaries','Posting photographs of the children you babysit on social media is:','[{"key":"a","text":"Fine if they look happy"},{"key":"b","text":"Fine if you do not name them"},{"key":"c","text":"Not acceptable without the parents'' explicit permission"},{"key":"d","text":"Encouraged to build your profile"}]','c'),
    ('babysitter','documentation_record_keeping','If a minor accident happens during your booking you should:','[{"key":"a","text":"Mention it only if asked"},{"key":"b","text":"Record what happened and when, and tell the parents on their return"},{"key":"c","text":"Keep it to yourself to avoid worrying them"},{"key":"d","text":"Write it down next week"}]','b'),

    ('mothers_helper','role_specific','A mother''s helper works:','[{"key":"a","text":"Entirely unsupervised with sole charge of the children"},{"key":"b","text":"Alongside the parent, supporting with childcare and household tasks"},{"key":"c","text":"Only at night"},{"key":"d","text":"Only with school-age children"}]','b'),
    ('mothers_helper','role_specific','A parent asks you to take sole charge of the children for a full day, which is outside your agreed role. You should:','[{"key":"a","text":"Agree without discussion"},{"key":"b","text":"Discuss it first, and only agree if you are competent, insured and it is properly arranged"},{"key":"c","text":"Refuse and end the booking immediately"},{"key":"d","text":"Bring a friend to help"}]','b'),
    ('mothers_helper','safeguarding','You notice unexplained bruising on a child during your regular visits. You should:','[{"key":"a","text":"Assume it is normal play"},{"key":"b","text":"Record what you observed and raise a safeguarding concern through the proper channel"},{"key":"c","text":"Ask the neighbours"},{"key":"d","text":"Say nothing as you are not the main carer"}]','b'),
    ('mothers_helper','health_safety','When carrying out household tasks with young children present you should:','[{"key":"a","text":"Leave cleaning products out for convenience"},{"key":"b","text":"Keep hazardous products secured and out of reach at all times"},{"key":"c","text":"Ask the children to help with them"},{"key":"d","text":"Work only while they nap"}]','b'),
    ('mothers_helper','gdpr_confidentiality','Family information you learn while working in someone''s home should be:','[{"key":"a","text":"Shared with other families you work for"},{"key":"b","text":"Kept confidential unless there is a safeguarding reason to share"},{"key":"c","text":"Posted in online groups for advice"},{"key":"d","text":"Discussed with your friends"}]','b')
  ) as v(role_code, topic, question_text, options, correct_option)
  join professional_roles r on r.code = v.role_code
 where not exists (
   select 1 from assessment_question_bank q
    where q.professional_role_id = r.id
      and q.question_text = v.question_text
 );

/* --------------------------------------------------------------- reads ---- */

-- These are lookup tables and follow professional_roles / document_types: no RLS,
-- access controlled by grants alone. The blanket grants in 0016 and 0021 ran
-- before these tables existed, so grant explicitly. anon needs read access
-- because the public services page lists the categories and their roles.
grant select on role_categories, care_types to anon, authenticated;
grant all    on role_categories, care_types to service_role;
