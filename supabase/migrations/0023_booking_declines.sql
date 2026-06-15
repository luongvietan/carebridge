create table booking_declines (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references bookings(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  reason          text,
  declined_at     timestamptz not null default now(),
  unique (booking_id, professional_id)
);
create index idx_booking_declines_prof on booking_declines(professional_id);

alter table booking_declines enable row level security;

create policy booking_declines_admin_all on booking_declines for all
  using (public.is_admin()) with check (public.is_admin());

create policy booking_declines_self on booking_declines for all
  using (professional_id in (select id from professionals where user_id = auth.uid()))
  with check (professional_id in (select id from professionals where user_id = auth.uid()));
grant select, insert, update, delete on booking_declines to authenticated;
