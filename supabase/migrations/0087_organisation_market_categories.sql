-- Portuguese organisations: their own categories and registration details
-- (Ana, 8 August: "the Portugal version needs organisation categories and
-- registration information appropriate for the Portuguese market, rather than
-- simply translating UK organisation terminology").
--
-- An organisation now records the market it registered in. A Portuguese one
-- picks a category (lar/ERPI, SAD, clínica, creche…), gives its NIPC and, where
-- the category is licensed, the ERS registration or ISS alvará number. The UK
-- keeps its CQC number; none of the new columns is required in the UK.

alter table organisations
  add column if not exists country_code char(2) references countries(code) default 'GB';
update organisations set country_code = 'GB' where country_code is null;
alter table organisations alter column country_code set not null;

alter table organisations add column if not exists organisation_category text;
alter table organisations add column if not exists tax_number text;
alter table organisations add column if not exists licence_number text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'organisations_category_check') then
    alter table organisations
      add constraint organisations_category_check check (
        organisation_category is null or organisation_category in (
          'pt_hospital_clinica', 'pt_rncci', 'pt_erpi', 'pt_sad', 'pt_centro_dia',
          'pt_ipss', 'pt_creche', 'pt_escola_atl', 'pt_empresa', 'pt_outra'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'organisations_tax_number_check') then
    alter table organisations
      add constraint organisations_tax_number_check
      check (tax_number is null or tax_number ~ '^[0-9]{9}$');
  end if;
end $$;

comment on column organisations.country_code is
  'Market the organisation registered in (GB / PT).';
comment on column organisations.organisation_category is
  'Portuguese organisation category (pt_*); null for UK organisations.';
comment on column organisations.tax_number is
  'NIPC (Portuguese company tax number, 9 digits, mod-11 checked in the app).';
comment on column organisations.licence_number is
  'ERS registration number or ISS alvará / licence, where the category is licensed.';

create index if not exists idx_organisations_country on organisations(country_code);

/* ------------------------------------------------------------- export ---- */

-- New columns go at the end so the view can be replaced in place.
create or replace view v_export_organisations
with (security_invoker = true) as
select id, organisation_name, contact_person, phone, email_contact,
       city, postcode, cqc_registration_number, billing_email, created_at,
       country_code, organisation_category, tax_number, licence_number
from organisations;

revoke all on public.v_export_organisations from anon, authenticated;

/* ------------------------------------------------------ anonymisation ---- */

-- GDPR erasure: the 0085 function, plus the organisation's NIPC and licence
-- (a sole trader's NIPC is their personal NIF).
create or replace function public.fn_anonymise_user(p_user_id uuid, p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update users
     set email = 'anonymised+' || p_user_id || '@deleted.invalid',
         is_active = false,
         account_status = 'deactivated',
         updated_at = now()
   where id = p_user_id;

  update professionals
     set full_name = 'Anonymised professional',
         date_of_birth = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         national_insurance_no = null,
         niss = null,
         professional_summary = null,
         profile_photo_path = null,
         professional_status = 'removed',
         updated_at = now()
   where user_id = p_user_id;

  delete from professional_skills
   where professional_id in (select id from professionals where user_id = p_user_id);
  delete from professional_availability
   where professional_id in (select id from professionals where user_id = p_user_id);

  update documents
     set original_filename = null, reference_number = null, issuing_body = null,
         storage_path = '', notes = null, updated_at = now()
   where professional_id in (select id from professionals where user_id = p_user_id);

  update private_clients
     set full_name = 'Anonymised client', phone = null, email_contact = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         updated_at = now()
   where user_id = p_user_id;

  update organisations
     set organisation_name = 'Anonymised organisation', contact_person = null,
         phone = null, email_contact = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         cqc_registration_number = null, billing_email = null, billing_address = null,
         tax_number = null, licence_number = null,
         updated_at = now()
   where user_id = p_user_id;

  insert into audit_log (actor_user_id, actor_type, action, entity_type, entity_id, summary)
  values (p_admin_id, 'admin', 'user.anonymised', 'user', p_user_id::text,
          'Personal data anonymised on GDPR erasure request; compliance and financial records retained');
end;
$$;


revoke all on function public.fn_anonymise_user(uuid, uuid) from public, anon, authenticated;

/* ------------------------------------------- auth e-mail language ------- */

-- Supabase's own sign-up and password-reset e-mails read user_metadata.market
-- to choose Portuguese (supabase/templates). New sign-ups carry it; tag the
-- Portuguese professionals who registered before it existed.
update auth.users u
   set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || '{"market":"PT"}'::jsonb
  from professionals p
 where p.user_id = u.id
   and p.country_code = 'PT'
   and coalesce(u.raw_user_meta_data->>'market', '') <> 'PT';
