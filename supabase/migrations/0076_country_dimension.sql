-- Portugal Phase 1 (client agreement, 10 August 2026).
--
-- "The Portugal compliance engine should be configurable separately from the UK
-- one rather than hard-coded, as we will have different documents, professional
-- registrations, assessments and renewal requirements by country and role."
--
-- This migration is that sentence made structural. Roles stop belonging to "the
-- platform" and start belonging to "the platform, in a country"; the regulator a
-- role answers to becomes data with a wider set of possible values; and the
-- activation guard stops naming the nanny role and starts reading the role's own
-- register. Nothing here is Portugal-specific — the Portuguese data arrives in
-- 0077, and can only arrive because of what is below.

create table if not exists countries (
  code        char(2) primary key,
  name        text not null,
  currency    char(3) not null,
  locale      text not null,
  -- Portugal stays false until its regulatory framework is finished, which is
  -- what the "launching soon" badge on the site reads from.
  is_live     boolean not null default false,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

insert into countries (code, name, currency, locale, is_live, sort_order) values
  ('GB','United Kingdom','GBP','en-GB', true,  1),
  ('PT','Portugal',      'EUR','pt-PT', false, 2)
on conflict (code) do nothing;

/* --------------------------------------------------------------- roles ---- */

alter table professional_roles
  add column if not exists country_code char(2) references countries(code);

-- Everything that exists today is a UK role.
update professional_roles set country_code = 'GB' where country_code is null;
alter table professional_roles alter column country_code set not null;

create index if not exists idx_roles_country on professional_roles(country_code);

-- Role codes are unique platform-wide, so a Portuguese nurse role cannot reuse
-- the UK code. That is deliberate: the two are different roles with different
-- requirements, and sharing a code would let a UK rule leak into Portugal.

/* ------------------------------------------------------ document types ---- */

-- Null means the document is used in any country (photo ID, references,
-- qualifications). A value scopes it to one — an Enhanced DBS is meaningless in
-- Portugal, and a registo criminal is meaningless in the UK.
alter table document_types
  add column if not exists country_code char(2) references countries(code);

update document_types set country_code = 'GB'
 where code in ('enhanced_dbs','dbs_update_service','ofsted_registration',
                'professional_registration','right_to_work','ccps')
   and country_code is null;

comment on column document_types.country_code is
  'Country this document belongs to; null when it applies in any country.';

/* ---------------------------------------------------------- registers ----- */

-- The Portuguese regulators, alongside the UK ones.
alter table professional_roles drop constraint if exists professional_roles_register_check;
alter table professional_roles
  add constraint professional_roles_register_check
  check (registration_register is null or registration_register in
    ('nmc','ofsted','hcpc','ordem_enfermeiros','ordem_fisioterapeutas','iss'));

alter table registration_verifications drop constraint if exists registration_verifications_register_check;
alter table registration_verifications
  add constraint registration_verifications_register_check
  check (register in
    ('nmc','ofsted','hcpc','ordem_enfermeiros','ordem_fisioterapeutas','iss'));

/* --------------------------------------------------- professional home ---- */

alter table professionals
  add column if not exists country_code char(2) references countries(code) default 'GB';
update professionals set country_code = 'GB' where country_code is null;

-- The number an ISS-authorised Ama holds. Kept separate from
-- registration_number (a cédula profissional or an NMC PIN) because it is a
-- different kind of thing: an authorisation to carry out an activity, not
-- membership of a professional body.
alter table professionals
  add column if not exists iss_authorisation_number text;

comment on column professionals.iss_authorisation_number is
  'Portuguese Social Security (ISS) authorisation number. Mandatory for an Ama Autorizada; verified by an administrator before activation.';

/* ------------------------------------------------------ activation guard -- */

-- 0063 hard-coded the nanny role and 0067 widened it to childminders. Neither
-- would have known about an Ama. The guard now reads the register from the role
-- and demands whichever reference that register uses, so adding a regulated role
-- in a new country is data, not another edit to this function.
create or replace function enforce_registration_reference()
returns trigger
language plpgsql
as $$
declare
  register text;
  role_name text;
begin
  if new.professional_status <> 'active' then
    return new;
  end if;

  select r.registration_register, r.name into register, role_name
    from professional_roles r
   where r.id = new.professional_role_id;

  if register is null then
    return new;
  end if;

  if register = 'ofsted'
     and coalesce(btrim(new.ofsted_registration_number), '') = '' then
    raise exception 'An Ofsted registration number is required before a % can be activated', role_name;
  end if;

  if register = 'iss'
     and coalesce(btrim(new.iss_authorisation_number), '') = '' then
    raise exception 'An ISS authorisation number is required before a % can be activated', role_name;
  end if;

  if register in ('nmc','hcpc','ordem_enfermeiros','ordem_fisioterapeutas')
     and coalesce(btrim(new.registration_number), '') = '' then
    raise exception 'A professional registration number is required before a % can be activated', role_name;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prof_ofsted on professionals;
drop trigger if exists trg_prof_registration on professionals;
create trigger trg_prof_registration
  before insert or update on professionals
  for each row execute function enforce_registration_reference();

drop function if exists enforce_ofsted_for_nanny();

/* ------------------------------------------------------------- reads ------ */

grant select on countries to anon, authenticated;
grant all on countries to service_role;

alter table countries enable row level security;
drop policy if exists countries_read on countries;
create policy countries_read on countries for select to anon, authenticated using (true);
