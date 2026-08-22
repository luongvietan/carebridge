-- Client requirement (Ana, 22 June 2026): a professional may hold more than one
-- role, and must pass the assessment for each role they hold.
--
-- Until now a professional WAS a role: `professionals.professional_role_id`, one
-- nullable column, read by the booking trigger, the compliance sweep, the
-- activation gate, the question bank and the export views. A carer who also
-- childminds had to choose, or keep two accounts.
--
-- This migration adds the relationship and backfills it. It changes no
-- behaviour: the old column keeps its meaning, and a trigger keeps it pointing
-- at the primary role. 0084 moves the behaviour across, once this data exists.

/* ------------------------------------------------------------------ enum --- */

do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_assignment_status') then
    create type role_assignment_status as enum
      ('pending', 'active', 'restricted', 'withdrawn');
  end if;
end $$;

comment on type role_assignment_status is
  'pending: applied for, not yet eligible. active: may take bookings in this role. '
  'restricted: was active, now blocked (expired document, lapsed registration). '
  'withdrawn: given up by the professional — kept so historic bookings still resolve.';

/* ----------------------------------------------------------------- table --- */

create table if not exists professional_role_assignments (
  id                      uuid primary key default gen_random_uuid(),
  professional_id         uuid not null references professionals(id) on delete cascade,
  professional_role_id    uuid not null references professional_roles(id),
  is_primary              boolean not null default false,
  status                  role_assignment_status not null default 'pending',
  -- The assessment cycle is per role: failing the childminder assessment three
  -- times must not lock a nurse out of nursing.
  assessment_locked_until date,
  -- The register reference for THIS role. The profile carries three reference
  -- columns — one per KIND of reference, not per role — which holds for a nurse
  -- who also childminds (NMC PIN and Ofsted URN are different columns) but
  -- collides for an Adult Nurse who is also a Physiotherapist: an NMC PIN and an
  -- HCPC number both want `registration_number`. A non-primary assignment
  -- therefore carries its own; null means "the profile column is the answer",
  -- which is what every backfilled primary assignment says.
  registration_reference  text,
  added_at                timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (professional_id, professional_role_id)
);

-- Exactly one primary role per professional.
create unique index if not exists uq_prof_primary_role
  on professional_role_assignments (professional_id) where is_primary;

create index if not exists idx_role_assign_prof
  on professional_role_assignments (professional_id);
create index if not exists idx_role_assign_role_status
  on professional_role_assignments (professional_role_id, status);

drop trigger if exists trg_role_assign_updated on professional_role_assignments;
create trigger trg_role_assign_updated before update on professional_role_assignments
  for each row execute function set_updated_at();

/* -------------------------------------------------------------- backfill --- */

-- One row per professional who has a role today, marked primary, with the
-- status their current profile already implies. can_accept_bookings is the
-- generated column that governs booking assignment right now, so reading it
-- means nobody gains or loses the ability to work at this migration.
insert into professional_role_assignments
  (professional_id, professional_role_id, is_primary, status, assessment_locked_until)
select p.id,
       p.professional_role_id,
       true,
       case
         when p.can_accept_bookings then 'active'::role_assignment_status
         when p.professional_status in ('booking_restricted', 'compliance_hold',
                                        'temporarily_suspended', 'under_investigation',
                                        'rejected', 'removed')
           then 'restricted'::role_assignment_status
         else 'pending'::role_assignment_status
       end,
       p.assessment_locked_until
  from professionals p
 where p.professional_role_id is not null
on conflict (professional_id, professional_role_id) do nothing;

/* ------------------------------------------------------------ both ways --- */

-- The assignment table is the source of truth; the column is the projection of
-- its primary row. Both directions are maintained so the call sites can migrate
-- one at a time instead of in a single sweep across 24 files.
--
-- Neither trigger can loop: each writes only when the value it would write
-- differs from what is already there, so the second hop finds nothing to do.

create or replace function public.sync_primary_role_to_professional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.is_primary then
    return new;
  end if;
  update professionals
     set professional_role_id = new.professional_role_id
   where id = new.professional_id
     and professional_role_id is distinct from new.professional_role_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_primary_role on professional_role_assignments;
create trigger trg_sync_primary_role
  after insert or update of professional_role_id, is_primary
  on professional_role_assignments
  for each row execute function public.sync_primary_role_to_professional();

create or replace function public.sync_professional_to_primary_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.professional_role_id is null then
    return new;
  end if;

  -- Demote whatever was primary, then claim it. Order matters: the partial
  -- unique index allows only one primary row per professional.
  update professional_role_assignments
     set is_primary = false
   where professional_id = new.id
     and is_primary
     and professional_role_id is distinct from new.professional_role_id;

  insert into professional_role_assignments
    (professional_id, professional_role_id, is_primary, status, assessment_locked_until)
  values
    (new.id, new.professional_role_id, true,
     case when new.professional_status = 'active' and new.compliance_status = 'approved'
          then 'active'::role_assignment_status
          else 'pending'::role_assignment_status end,
     new.assessment_locked_until)
  on conflict (professional_id, professional_role_id)
    do update set is_primary = true;

  return new;
end;
$$;

drop trigger if exists trg_sync_professional_role on professionals;
create trigger trg_sync_professional_role
  after insert or update of professional_role_id on professionals
  for each row execute function public.sync_professional_to_primary_role();

/* ------------------------------------------------------------------ RLS --- */

alter table professional_role_assignments enable row level security;

-- A professional reads their own roles. Every write goes through the service
-- role (server actions) or an admin, for the same reason 0032 locks
-- professional_status: otherwise somebody could grant themselves an active role
-- from the browser and take bookings they are not cleared for.
drop policy if exists role_assignments_self_read on professional_role_assignments;
create policy role_assignments_self_read on professional_role_assignments
  for select to authenticated
  using (exists (
    select 1 from professionals p
     where p.id = professional_role_assignments.professional_id
       and p.user_id = auth.uid()
  ));

drop policy if exists role_assignments_admin_all on professional_role_assignments;
create policy role_assignments_admin_all on professional_role_assignments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on professional_role_assignments to authenticated;
grant all    on professional_role_assignments to service_role;

comment on table professional_role_assignments is
  'The roles a professional holds, each with its own eligibility and assessment cycle. '
  'professionals.professional_role_id mirrors the primary row.';
