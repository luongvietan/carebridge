-- Client request, 7 August 2026: professionals log the hours they actually
-- worked, and the client or manager confirms them before payment is released.
--
-- Scope decision, flagged to the client: this gates the PAYOUT to the
-- professional, not the client's charge. The charge is still taken when the
-- booking is staffed, which protects the platform against a card that fails
-- after the work is done; what waits for confirmation is the money going out.
--
-- A booking's snapshot rate is per hour, so confirmed hours are what a payout
-- should be based on. This migration records and confirms them; the payout
-- amount continues to follow the booking's own totals until the client tells us
-- she wants payouts recalculated from actual hours (which changes what a client
-- is charged too, and is her decision to make).

create table if not exists timesheets (
  id                uuid primary key default gen_random_uuid(),
  -- One timesheet per booking: a second one would be an amendment, and there is
  -- no amendment flow yet.
  booking_id        uuid not null unique references bookings(id) on delete cascade,
  professional_id   uuid not null references professionals(id) on delete cascade,
  actual_start      timestamptz not null,
  actual_end        timestamptz not null,
  break_minutes     integer not null default 0 check (break_minutes >= 0 and break_minutes < 1440),
  worked_hours      numeric(6,2) generated always as (
                      round(
                        (extract(epoch from (actual_end - actual_start)) / 3600.0)
                        - (break_minutes / 60.0)
                      , 2)
                    ) stored,
  professional_note text,
  status            text not null default 'submitted'
                      check (status in ('submitted','confirmed','disputed')),
  submitted_at      timestamptz not null default now(),
  confirmed_at      timestamptz,
  confirmed_by      uuid references users(id),
  -- A silent client must not be able to withhold somebody's pay indefinitely.
  auto_confirmed    boolean not null default false,
  dispute_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint timesheets_window_check check (actual_end > actual_start)
);

create index if not exists idx_timesheets_status on timesheets(status, submitted_at);
create index if not exists idx_timesheets_professional on timesheets(professional_id);

-- Paid work must be evidenced by confirmed hours from here on. Bookings already
-- completed before this existed keep their old behaviour rather than becoming
-- unpayable.
alter table bookings
  add column if not exists requires_timesheet boolean not null default true;

update bookings set requires_timesheet = false
 where status in ('completed','cancelled','no_show');

alter table timesheets enable row level security;

-- The professional who worked the shift, and the client or organisation who
-- booked it, can each see it; only admins write through RLS. The app's own
-- writes go through the service role with explicit ownership checks, mirroring
-- the rest of the booking flow.
drop policy if exists timesheets_professional_read on timesheets;
create policy timesheets_professional_read on timesheets
  for select to authenticated
  using (exists (
    select 1 from professionals p
     where p.id = timesheets.professional_id and p.user_id = auth.uid()
  ));

drop policy if exists timesheets_requester_read on timesheets;
create policy timesheets_requester_read on timesheets
  for select to authenticated
  using (exists (
    select 1 from bookings b
     where b.id = timesheets.booking_id and b.requester_user_id = auth.uid()
  ));

drop policy if exists timesheets_admin_all on timesheets;
create policy timesheets_admin_all on timesheets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on timesheets to authenticated;
grant all on timesheets to service_role;

/* ------------------------------------------------------------- export ----- */

create or replace view v_export_timesheets
with (security_invoker = true) as
select t.id, t.booking_id, p.full_name as professional, r.name as role,
       b.scheduled_start, b.scheduled_end, b.duration_hours as booked_hours,
       t.actual_start, t.actual_end, t.break_minutes, t.worked_hours,
       t.status, t.submitted_at, t.confirmed_at, t.auto_confirmed, t.dispute_reason
  from timesheets t
  join bookings b on b.id = t.booking_id
  join professionals p on p.id = t.professional_id
  left join professional_roles r on r.id = b.professional_role_id;

revoke all on public.v_export_timesheets from anon, authenticated;
grant select on public.v_export_timesheets to service_role;

/* ------------------------------------------------------ notifications ----- */

alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded',
    'booking_available','compliance_rejected','further_info_required','password_reset',
    'professional_rejected','account_removed','professional_suspended',
    'timesheet_submitted','timesheet_confirmed','timesheet_disputed'));

insert into notification_templates (type, subject, body) values
  ('timesheet_submitted','Hours submitted for your booking',
   'The professional has submitted {{worked_hours}} hours for booking {{booking_id}}. Please review and confirm them so payment can be released.'),
  ('timesheet_confirmed','Your hours have been confirmed',
   'The hours you submitted for booking {{booking_id}} have been confirmed. Your payout will follow.'),
  ('timesheet_disputed','A query has been raised about your hours',
   'The client has queried the hours submitted for booking {{booking_id}}. Reason: {{reason}}. An administrator will be in touch.')
on conflict (type) do nothing;
