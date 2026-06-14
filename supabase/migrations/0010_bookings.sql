create table bookings (
  id                       uuid primary key default gen_random_uuid(),
  requester_user_id        uuid not null references users(id),
  private_client_id        uuid references private_clients(id),
  organisation_id          uuid references organisations(id),
  professional_role_id     uuid not null references professional_roles(id),
  assigned_professional_id uuid references professionals(id),
  booking_type             text not null default 'open_market'
                            check (booking_type in ('open_market','admin_assigned')),
  status                   booking_status not null default 'open',
  scheduled_start          timestamptz not null,
  scheduled_end            timestamptz not null,
  duration_hours           numeric(5,2) not null,
  location_address         text not null,
  location_postcode        text,
  notes                    text,
  rate_card_id             uuid references rate_cards(id),
  snap_client_charge_rate  numeric(10,2) not null,
  snap_payout_rate         numeric(10,2) not null,
  snap_platform_fee        numeric(10,2) not null,
  snap_currency            char(3) not null default 'GBP',
  total_client_charge      numeric(10,2) generated always as (snap_client_charge_rate * duration_hours) stored,
  total_payout             numeric(10,2) generated always as (snap_payout_rate * duration_hours) stored,
  assigned_by              uuid references users(id),
  accepted_at              timestamptz,
  created_by               uuid references users(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint one_requester check (num_nonnulls(private_client_id, organisation_id) = 1),
  constraint valid_window  check (scheduled_end > scheduled_start)
);
create index idx_bookings_status on bookings(status);
create index idx_bookings_prof   on bookings(assigned_professional_id);
create index idx_bookings_role   on bookings(professional_role_id);
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();

create table booking_status_history (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  from_status booking_status,
  to_status   booking_status not null,
  changed_by  uuid references users(id),
  reason      text,
  changed_at  timestamptz not null default now()
);

create table booking_cancellations (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references bookings(id) on delete cascade,
  cancelled_by   uuid references users(id),
  cancelled_role text check (cancelled_role in ('professional','client','organisation','admin')),
  is_last_minute boolean not null default false,
  reason         text,
  cancelled_at   timestamptz not null default now()
);
