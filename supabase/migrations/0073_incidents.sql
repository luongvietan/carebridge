-- Client request, 7 August 2026: "a Complaints & Incident Management section
-- where concerns, investigations and outcomes can be recorded and tracked".
--
-- One record type covers both. A complaint and an incident follow the same
-- life — raised, investigated, resolved — and splitting them into two tables
-- would mean two screens and two half-used reports; the distinction is a
-- category on the record.
--
-- Deliberately admin-only. A complaint may name a professional and quote a
-- family; exposing it to either party before it is investigated is how a
-- safeguarding process turns into a dispute. Sharing an outcome is a
-- conversation, not a table read.

create table if not exists incidents (
  id             uuid primary key default gen_random_uuid(),
  -- Short human reference so it can be quoted in an email or a phone call.
  reference      text not null unique,
  category       text not null check (category in ('complaint','incident','safeguarding','other')),
  severity       text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status         text not null default 'open' check (status in ('open','investigating','resolved','closed')),
  subject        text not null,
  details        text not null,

  -- Who or what it concerns. All optional: a concern can be about a
  -- professional, a booking, an organisation, or none of them.
  professional_id  uuid references professionals(id) on delete set null,
  booking_id       uuid references bookings(id) on delete set null,
  organisation_id  uuid references organisations(id) on delete set null,
  private_client_id uuid references private_clients(id) on delete set null,

  -- How it reached us, in words, since it is often a phone call.
  reported_by    text,
  raised_at      timestamptz not null default now(),

  investigation  text,
  outcome        text,
  resolved_at    timestamptz,
  closed_at      timestamptz,

  opened_by      uuid references users(id),
  assigned_to    uuid references users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_incidents_status on incidents(status, raised_at desc);
create index if not exists idx_incidents_professional on incidents(professional_id);

alter table incidents enable row level security;

drop policy if exists incidents_admin_all on incidents;
create policy incidents_admin_all on incidents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant all on incidents to service_role;

/* -------------------------------------------------------------- export ---- */

create or replace view v_export_incidents
with (security_invoker = true) as
select i.reference, i.category, i.severity, i.status, i.subject,
       p.full_name as professional, i.booking_id,
       i.reported_by, i.raised_at, i.resolved_at, i.closed_at,
       i.outcome
  from incidents i
  left join professionals p on p.id = i.professional_id;

revoke all on public.v_export_incidents from anon, authenticated;
grant select on public.v_export_incidents to service_role;
