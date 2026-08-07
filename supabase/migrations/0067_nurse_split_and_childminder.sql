-- Client request, 7 August 2026: Registered Nurse splits into Adult, Children's
-- (Paediatric) and Mental Health, and childminders join nannies as an
-- Ofsted-registered childcare role.
--
-- The existing role is RENAMED to Adult Nurse rather than retired and replaced.
-- Every professional and booking already pointing at it keeps pointing at it, so
-- nothing has to be re-mapped and no historical booking loses its role. A nurse
-- who is actually paediatric or mental health can be moved by an administrator;
-- defaulting the other way — retiring the role and leaving people role-less —
-- would strand them mid-onboarding and break bookings that reference it.

update professional_roles
   set code = 'adult_nurse', name = 'Adult Nurse'
 where code = 'registered_nurse';

insert into professional_roles (code, name, category_id)
select v.code, v.name, (select id from role_categories where code = 'healthcare')
  from (values
    ('paediatric_nurse',   'Children''s (Paediatric) Nurse'),
    ('mental_health_nurse','Mental Health Nurse')
  ) as v(code, name)
on conflict (code) do nothing;

-- Childminders are Ofsted-registered like nannies, but work from their own home.
insert into professional_roles (code, name, category_id)
select 'childminder', 'Childminder', (select id from role_categories where code = 'childcare')
on conflict (code) do nothing;

/* ------------------------------------------------ compliance requirements -- */

-- The two new nursing roles carry exactly the Adult Nurse requirement set: same
-- regulator, same critical documents.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, cr.document_type_id
  from professional_roles r
  cross join compliance_requirements cr
 where r.code in ('paediatric_nurse','mental_health_nurse')
   and cr.professional_role_id = (select id from professional_roles where code = 'adult_nurse')
on conflict (professional_role_id, document_type_id) do nothing;

-- A childminder is vetted exactly as a nanny is, Ofsted registration included.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, cr.document_type_id
  from professional_roles r
  cross join compliance_requirements cr
 where r.code = 'childminder'
   and cr.professional_role_id = (select id from professional_roles where code = 'nanny')
on conflict (professional_role_id, document_type_id) do nothing;

/* ------------------------------------------------------------- rate cards -- */

-- The new nursing roles inherit the Adult Nurse rate so bookings work from day
-- one; the client can differentiate them at /admin/rates whenever she wants to.
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate,
                        platform_fee_type, platform_fee_value, currency, notes)
select r.id, base.client_charge_rate, base.professional_payout_rate,
       base.platform_fee_type, base.platform_fee_value, base.currency,
       'Copied from the Adult Nurse rate on the role split — confirm whether these roles should be priced differently'
  from professional_roles r
  cross join lateral (
    select rc.* from rate_cards rc
     where rc.professional_role_id = (select id from professional_roles where code = 'adult_nurse')
       and rc.effective_to is null
     limit 1
  ) base
 where r.code in ('paediatric_nurse','mental_health_nurse')
   and not exists (
     select 1 from rate_cards rc
      where rc.professional_role_id = r.id and rc.effective_to is null
   );

insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, notes)
select r.id, 16.00, 13.00,
       'PLACEHOLDER — awaiting confirmed childcare rates from the client'
  from professional_roles r
 where r.code = 'childminder'
   and not exists (
     select 1 from rate_cards rc
      where rc.professional_role_id = r.id and rc.effective_to is null
   );

/* ----------------------------------------------------------------- Ofsted -- */

-- 0063 hard-coded the nanny role. Childminders are Ofsted-registered too, and
-- compulsorily so, which makes this guard more important for them, not less.
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

  if role_code in ('nanny','childminder')
     and coalesce(btrim(new.ofsted_registration_number), '') = '' then
    raise exception
      'Ofsted registration number is required before a % can be activated', role_code;
  end if;

  return new;
end;
$$;

comment on column professionals.ofsted_registration_number is
  'Ofsted registration number (URN). Mandatory for the nanny and childminder roles; verified by an administrator against the Ofsted register before activation.';
