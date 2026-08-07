-- Client request, 7 August 2026: "the platform must ensure that regulated
-- professionals cannot be approved until their registration has been verified
-- and remains valid" — for nurses against the NMC register, and for nannies and
-- childminders against the Ofsted register.
--
-- Until now the platform collected the number and reminded the administrator to
-- check it. It did not record that the check happened, did not stop an approval
-- if it never did, and had no notion of the check going stale. This adds the
-- missing thing: the verification itself, as a first-class record.
--
-- Neither regulator publishes a free API for this, so the lookup stays a human
-- step. What the platform can do — and now does — is make it unskippable,
-- attribute it to a named administrator with a timestamp, and expire it.

/* ---------------------------------------------- which register per role --- */

-- Kept on the role so the sweep and the activation gate read it from data
-- rather than a hard-coded list of role codes; mirrors
-- apps/web/src/lib/compliance/regulated-roles.ts.
alter table professional_roles
  add column if not exists registration_register text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'professional_roles_register_check') then
    alter table professional_roles
      add constraint professional_roles_register_check
      check (registration_register is null or registration_register in ('nmc','ofsted','hcpc'));
  end if;
end $$;

update professional_roles set registration_register = 'nmc'
 where code in ('adult_nurse','paediatric_nurse','mental_health_nurse');
update professional_roles set registration_register = 'hcpc'
 where code = 'physiotherapist';
update professional_roles set registration_register = 'ofsted'
 where code in ('nanny','childminder');

comment on column professional_roles.registration_register is
  'Public register this role must be checked against before activation; null for roles governed by their document set alone.';

/* ------------------------------------------------------- verifications ---- */

create table if not exists registration_verifications (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  register        text not null check (register in ('nmc','ofsted','hcpc')),
  -- The reference as it was checked, so a later change to the professional's
  -- profile cannot silently re-point an old verification at a new number.
  reference       text not null,
  outcome         text not null check (outcome in ('active','not_found','details_mismatch','lapsed')),
  checked_by      uuid references users(id),
  checked_at      timestamptz not null default now(),
  -- A verification is a statement about a moment. The client asked for it to
  -- "remain valid", which means it has to go stale on its own.
  valid_until     date not null,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_reg_verif_professional
  on registration_verifications(professional_id, register, checked_at desc);

alter table registration_verifications enable row level security;

-- Administrators (and the service role, which bypasses RLS) manage these; a
-- professional can see their own, which is what makes the check visible to the
-- person it is about without letting them write it.
drop policy if exists reg_verif_admin_all on registration_verifications;
create policy reg_verif_admin_all on registration_verifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists reg_verif_own_read on registration_verifications;
create policy reg_verif_own_read on registration_verifications
  for select to authenticated
  using (exists (
    select 1 from professionals p
     where p.id = registration_verifications.professional_id
       and p.user_id = auth.uid()
  ));

grant select on registration_verifications to authenticated;
grant all on registration_verifications to service_role;

/* --------------------------------------------------------- current view --- */

-- The latest verification per professional and register.
create or replace view v_current_registration_verification
with (security_invoker = true) as
select distinct on (v.professional_id, v.register)
       v.professional_id, v.register, v.reference, v.outcome,
       v.checked_by, v.checked_at, v.valid_until
  from registration_verifications v
 order by v.professional_id, v.register, v.checked_at desc;

-- True when the role needs no register check, or the latest check says the
-- registration is active and has not gone stale.
create or replace function public.fn_registration_verified(p_professional_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when r.registration_register is null then true
    else exists (
      select 1 from v_current_registration_verification v
       where v.professional_id = p.id
         and v.register = r.registration_register
         and v.outcome = 'active'
         and v.valid_until >= current_date
    )
  end
  from professionals p
  join professional_roles r on r.id = p.professional_role_id
 where p.id = p_professional_id;
$$;

/* ------------------------------------------------------------- alerts ----- */

alter table compliance_alerts drop constraint if exists compliance_alerts_alert_type_check;
alter table compliance_alerts
  add constraint compliance_alerts_alert_type_check
  check (alert_type in ('expiring','expired','registration_expiring','registration_expired'));

/* -------------------------------------------------------------- sweep ----- */

-- Extends 0060 with the registration checks. Steps 1–3 are unchanged.
create or replace function public.fn_run_compliance_sweep() returns void
language plpgsql as $$
declare
  rec record;
begin
  -- 1) Expire approved documents past their expiry date
  update documents
     set verification_status = 'expired', updated_at = now()
   where verification_status = 'approved'
     and expiry_date is not null and expiry_date < current_date;

  -- 2) Raise 'expiring' alerts for critical docs within 30 days (de-duplicated)
  insert into compliance_alerts (professional_id, document_id, alert_type, due_date)
  select d.professional_id, d.id, 'expiring', d.expiry_date
    from documents d
    join document_types t on t.id = d.document_type_id
   where t.is_compliance_critical
     and d.verification_status = 'approved'
     and d.expiry_date between current_date and current_date + 30
     and not exists (
       select 1 from compliance_alerts a
        where a.document_id = d.id and a.alert_type = 'expiring' and not a.acknowledged);

  -- 2b) Raise a de-duplicated 'expired' alert for critical docs that have lapsed.
  insert into compliance_alerts (professional_id, document_id, alert_type, due_date)
  select d.professional_id, d.id, 'expired', d.expiry_date
    from documents d
    join document_types t on t.id = d.document_type_id
   where t.is_compliance_critical
     and d.verification_status = 'expired'
     and d.expiry_date is not null
     and not exists (
       select 1 from compliance_alerts a
        where a.document_id = d.id and a.alert_type = 'expired' and not a.acknowledged);

  -- 2c) Acknowledge the now-stale 'expiring' alert once the document has expired.
  update compliance_alerts a
     set acknowledged = true
    from documents d
   where a.document_id = d.id
     and a.alert_type = 'expiring'
     and not a.acknowledged
     and d.verification_status = 'expired';

  -- 2d) Registration verifications approaching their re-check date.
  insert into compliance_alerts (professional_id, alert_type, due_date)
  select v.professional_id, 'registration_expiring', v.valid_until
    from v_current_registration_verification v
    join professionals p on p.id = v.professional_id
   where v.outcome = 'active'
     and v.valid_until between current_date and current_date + 30
     and not exists (
       select 1 from compliance_alerts a
        where a.professional_id = v.professional_id
          and a.alert_type = 'registration_expiring'
          and not a.acknowledged);

  -- 2e) Registration verification lapsed, or the register said it was not active.
  insert into compliance_alerts (professional_id, alert_type, due_date)
  select v.professional_id, 'registration_expired', v.valid_until
    from v_current_registration_verification v
   where (v.valid_until < current_date or v.outcome <> 'active')
     and not exists (
       select 1 from compliance_alerts a
        where a.professional_id = v.professional_id
          and a.alert_type = 'registration_expired'
          and not a.acknowledged);

  -- 2f) Acknowledge a stale "expiring" registration alert once it has lapsed.
  update compliance_alerts a
     set acknowledged = true
    from v_current_registration_verification v
   where a.professional_id = v.professional_id
     and a.alert_type = 'registration_expiring'
     and not a.acknowledged
     and (v.valid_until < current_date or v.outcome <> 'active');

  -- 3) Restrict ACTIVE professionals missing any approved critical doc for their
  --    role, OR whose register check has lapsed. Limited to 'active' so
  --    onboarding applicants are not mislabelled and an already-restricted
  --    professional is not re-flagged every night.
  for rec in
    select p.id as professional_id,
           not public.fn_registration_verified(p.id) as registration_lapsed
      from professionals p
     where p.professional_status = 'active'
       and (
         exists (
           select 1
             from compliance_requirements cr
             join document_types t on t.id = cr.document_type_id and t.is_compliance_critical
            where cr.professional_role_id = p.professional_role_id
              and not exists (
                select 1 from documents d
                 where d.professional_id = p.id
                   and d.document_type_id = cr.document_type_id
                   and d.verification_status = 'approved'))
         or not public.fn_registration_verified(p.id)
       )
  loop
    update professionals
       set compliance_status = 'compliance_expired',
           professional_status = 'booking_restricted',
           updated_at = now()
     where id = rec.professional_id;

    insert into professional_status_actions
      (professional_id, action_type, reason_code, reason_text, resulting_status, is_automatic)
    values
      (rec.professional_id, 'booking_restriction', 'missing_documents',
       case when rec.registration_lapsed
            then 'Automatic block: registration with the regulator is unverified, lapsed or due to be re-checked'
            else 'Automatic block: required critical compliance document missing or expired' end,
       'booking_restricted', true);

    insert into audit_log (actor_type, action, entity_type, entity_id, summary)
    values ('system','professional.auto_restricted','professional', rec.professional_id::text,
            case when rec.registration_lapsed
                 then 'Compliance sweep restricted professional — registration not verified'
                 else 'Compliance sweep restricted professional' end);
  end loop;
end;
$$;

/* --------------------------------------------------------- export view ---- */

create or replace view v_export_registration_verifications
with (security_invoker = true) as
select v.id, p.full_name, r.name as role, v.register, v.reference, v.outcome,
       v.checked_at, v.valid_until, u.email as checked_by, v.notes
  from registration_verifications v
  join professionals p on p.id = v.professional_id
  left join professional_roles r on r.id = p.professional_role_id
  left join users u on u.id = v.checked_by;

revoke all on public.v_export_registration_verifications from anon, authenticated;
grant select on public.v_export_registration_verifications to service_role;
