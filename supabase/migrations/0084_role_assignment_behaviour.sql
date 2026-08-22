-- Part two of multi-role (0083 added the relationship). This is where behaviour
-- moves from "the professional's role" to "this role of the professional's":
-- the assessment, the eligibility rules, the booking guard and the nightly
-- sweep. `professionals.professional_role_id` still means the primary role and
-- is still kept in sync, so anything not yet migrated keeps working.

/* -------------------------------------------- assessment, one per role --- */

alter table assessment_attempts
  add column if not exists professional_role_id uuid references professional_roles(id);

-- Every attempt that exists was sat for what is now the primary role.
update assessment_attempts a
   set professional_role_id = p.professional_role_id
  from professionals p
 where p.id = a.professional_id
   and a.professional_role_id is null
   and p.professional_role_id is not null;

-- The cycle counter is per professional AND role: three failed childminder
-- attempts must not consume a nurse's attempts. 0051 keyed attempts on
-- (professional, cycle, attempt); the role joins that key rather than replacing
-- it, so a reapplication cycle still means what it meant.
alter table assessment_attempts
  drop constraint if exists assessment_attempts_prof_cycle_attempt_key;

-- coalesce, not the bare column: two null roles would count as distinct and let
-- a pre-profile applicant (the assessment step comes before the profile step)
-- hold two copies of the same attempt, which the old constraint prevented.
create unique index if not exists uq_attempt_per_role
  on assessment_attempts (professional_id,
                          coalesce(professional_role_id, '00000000-0000-0000-0000-000000000000'::uuid),
                          assessment_cycle, attempt_number);

create index if not exists idx_attempt_role
  on assessment_attempts (professional_id, professional_role_id, passed);

-- An attempt always belongs to a role. Anything inserted without one is sitting
-- the primary role's assessment, which is what every caller meant before this
-- column existed — and filling it in is what keeps the uniqueness above honest,
-- since two null roles would otherwise count as distinct.
create or replace function public.default_attempt_role()
returns trigger
language plpgsql
as $$
begin
  if new.professional_role_id is null then
    select professional_role_id into new.professional_role_id
      from professionals where id = new.professional_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_attempt_default_role on assessment_attempts;
create trigger trg_attempt_default_role
  before insert on assessment_attempts
  for each row execute function public.default_attempt_role();

comment on column assessment_attempts.professional_role_id is
  'The role this attempt was sat for. Null only where the professional had no role at all.';

/* --------------------------------------- registration checks, per role --- */

-- The same rule as 0070, asked about a named role rather than about whichever
-- role the professional record happens to point at.
create or replace function public.fn_registration_verified_for_role(
  p_professional_id uuid,
  p_role_id uuid
) returns boolean
language sql
stable
as $$
  select case
    when r.registration_register is null then true
    else exists (
      select 1 from v_current_registration_verification v
       where v.professional_id = p_professional_id
         and v.register = r.registration_register
         and v.outcome = 'active'
         and v.valid_until >= current_date
    )
  end
  from professional_roles r
 where r.id = p_role_id;
$$;

-- Unchanged meaning: the primary role's answer. Kept so the admin panel, the
-- activation gate and the sweep's alert steps carry on calling it.
create or replace function public.fn_registration_verified(p_professional_id uuid)
returns boolean
language sql
stable
as $$
  select public.fn_registration_verified_for_role(p.id, p.professional_role_id)
    from professionals p
   where p.id = p_professional_id;
$$;

/* ---------------------------------------------------- role eligibility --- */

-- Mirrors canActivateProfessional() in
-- apps/web/src/lib/compliance/requirements.ts, scoped to one role:
--   * every critical document the ROLE requires is approved on the profile
--     (documents are shared — one approved DBS satisfies every role that needs
--     one, and nobody uploads the same certificate twice);
--   * the assessment for THAT role has been passed;
--   * the role's register check is current;
--   * the training attestation holds. That last one is deliberately shared: it
--     describes the person, not the role.
create or replace function public.fn_role_assignment_eligible(
  p_professional_id uuid,
  p_role_id uuid
) returns boolean
language plpgsql
stable
as $$
declare
  documents_compliant boolean;
  assessment_passed   boolean;
  training_current    boolean;
  has_training_cert   boolean;
begin
  select not exists (
    select 1
      from compliance_requirements cr
      join document_types t on t.id = cr.document_type_id and t.is_compliance_critical
     where cr.professional_role_id = p_role_id
       and not exists (
         select 1 from documents d
          where d.professional_id = p_professional_id
            and d.document_type_id = cr.document_type_id
            and d.verification_status = 'approved'))
    into documents_compliant;
  if not documents_compliant then return false; end if;

  select exists (
    select 1 from assessment_attempts a
     where a.professional_id = p_professional_id
       and a.professional_role_id = p_role_id
       and a.passed)
    into assessment_passed;
  if not assessment_passed then return false; end if;

  if not public.fn_registration_verified_for_role(p_professional_id, p_role_id) then
    return false;
  end if;

  select e.training_current into training_current
    from eligibility_screenings e
   where e.professional_id = p_professional_id
   order by e.submitted_at desc
   limit 1;

  -- No screening on record is not a failure — it is the state every
  -- professional who applied before the screening existed is in.
  if training_current is false then
    select exists (
      select 1 from documents d
      join document_types t on t.id = d.document_type_id
       where d.professional_id = p_professional_id
         and t.code = 'mandatory_training_certificate'
         and d.verification_status = 'approved')
      into has_training_cert;
    return has_training_cert;
  end if;

  return true;
end;
$$;

-- ACTIVATION asks all four questions above. STAYING active asks only the two
-- that can lapse: a document expires, a registration is not re-checked. This is
-- the rule 0070's sweep already applied, scoped to a role — and keeping the two
-- apart is deliberate. Assessment and training gates arrived after some
-- professionals were approved; using them to TAKE WORK AWAY would tighten a rule
-- retroactively on people who did nothing wrong, which is the mistake 0078
-- documents declining to make.
create or replace function public.fn_role_assignment_maintained(
  p_professional_id uuid,
  p_role_id uuid
) returns boolean
language sql
stable
as $$
  select not exists (
           select 1
             from compliance_requirements cr
             join document_types t on t.id = cr.document_type_id and t.is_compliance_critical
            where cr.professional_role_id = p_role_id
              and not exists (
                select 1 from documents d
                 where d.professional_id = p_professional_id
                   and d.document_type_id = cr.document_type_id
                   and d.verification_status = 'approved'))
     and public.fn_registration_verified_for_role(p_professional_id, p_role_id);
$$;

/* ------------------------------------------------------- recomputation --- */

-- Promote every live assignment that has become eligible. Called after anything
-- that can complete a role's evidence — a document approval, a passed
-- assessment, a recorded register check.
--
-- It only ever promotes. Taking a role away belongs to the nightly sweep, which
-- applies the narrower "maintained" rule, writes a status action and tells the
-- professional why — adding a second role must never be the thing that quietly
-- costs somebody their first.
--
-- 'withdrawn' is left alone: a professional who gave a role up does not get it
-- back because a document was renewed.
create or replace function public.fn_recompute_role_assignments(p_professional_id uuid)
returns void
language plpgsql
as $$
declare
  rec record;
  eligible boolean;
begin
  for rec in
    select id, professional_role_id, status
      from professional_role_assignments
     where professional_id = p_professional_id
       and status <> 'withdrawn'
  loop
    eligible := public.fn_role_assignment_eligible(p_professional_id, rec.professional_role_id);

    if eligible and rec.status <> 'active' then
      update professional_role_assignments
         set status = 'active', updated_at = now()
       where id = rec.id;
    end if;
  end loop;
end;
$$;

/* ------------------------------------------------------- booking guard --- */

-- Was: the professional's one role must equal the booking's role. Now: they
-- must hold that role, and it must be active. The profile-level gate
-- (can_accept_bookings, which carries suspension) is unchanged and still first.
create or replace function public.enforce_booking_eligibility() returns trigger
language plpgsql as $$
declare ok boolean; rmatch boolean;
begin
  if new.assigned_professional_id is null then return new; end if;

  select can_accept_bookings into ok
    from professionals where id = new.assigned_professional_id;
  if not coalesce(ok, false) then
    raise exception 'professional not eligible to accept bookings';
  end if;

  select exists (
    select 1 from professional_role_assignments a
     where a.professional_id = new.assigned_professional_id
       and a.professional_role_id = new.professional_role_id
       and a.status = 'active')
    into rmatch;
  if not coalesce(rmatch, false) then
    raise exception 'professional role does not match booking';
  end if;

  return new;
end; $$;

/* --------------------------------------------------------------- sweep --- */

-- Steps 1–2f are byte-for-byte those of 0070. Step 3 is the change: it now
-- restricts the ROLE that lost its evidence, and only drops the profile to
-- booking_restricted when nothing is left that the professional may work.
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

  -- 3) Restrict the ROLES of ACTIVE professionals that have lost their evidence
  --    — a missing critical document or a lapsed register check. A nurse who
  --    also childminds keeps nursing while the childminder role is held back.
  for rec in
    select a.id as assignment_id,
           a.professional_id,
           a.professional_role_id,
           not public.fn_registration_verified_for_role(a.professional_id, a.professional_role_id)
             as registration_lapsed
      from professional_role_assignments a
      join professionals p on p.id = a.professional_id
     where p.professional_status = 'active'
       and a.status = 'active'
       and not public.fn_role_assignment_maintained(a.professional_id, a.professional_role_id)
  loop
    update professional_role_assignments
       set status = 'restricted', updated_at = now()
     where id = rec.assignment_id;

    insert into audit_log (actor_type, action, entity_type, entity_id, summary)
    values ('system','professional.role_auto_restricted','professional',
            rec.professional_id::text,
            case when rec.registration_lapsed
                 then 'Compliance sweep restricted a role — registration not verified'
                 else 'Compliance sweep restricted a role — required document missing or expired'
            end);

    -- Nothing left to work: the profile itself is restricted, exactly as it was
    -- before multi-role, so every existing screen and notification still reads
    -- the right thing.
    if not exists (
      select 1 from professional_role_assignments a2
       where a2.professional_id = rec.professional_id and a2.status = 'active')
    then
      update professionals
         set compliance_status = 'compliance_expired',
             professional_status = 'booking_restricted',
             updated_at = now()
       where id = rec.professional_id
         and professional_status = 'active';

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
              'Compliance sweep restricted professional — no role left active');
    end if;
  end loop;
end;
$$;

/* --------------------------------------------------------- export view --- */

-- Appended, which is all `create or replace view` allows, and which keeps every
-- existing column where the founder's saved spreadsheets expect it. `role`
-- remains the primary role; the two new columns tell the fuller story.
create or replace view v_export_professionals with (security_invoker = true) as
select p.id, p.full_name, r.name as role, p.professional_status, p.compliance_status,
       p.can_accept_bookings, p.city, p.postcode, p.employment_status, p.created_at,
       cat.name as category,
       p.ofsted_registration_number,
       (select string_agg(ro.name, ', ' order by ro.name)
          from professional_role_assignments a
          join professional_roles ro on ro.id = a.professional_role_id
         where a.professional_id = p.id and a.status <> 'withdrawn') as all_roles,
       (select string_agg(ro.name, ', ' order by ro.name)
          from professional_role_assignments a
          join professional_roles ro on ro.id = a.professional_role_id
         where a.professional_id = p.id and a.status = 'active') as active_roles
from professionals p
left join professional_roles r on r.id = p.professional_role_id
left join role_categories cat on cat.id = r.category_id;

revoke all on public.v_export_professionals from anon, authenticated;
grant select on public.v_export_professionals to service_role;
