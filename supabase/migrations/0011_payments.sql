create table payments (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references bookings(id),
  payer_user_id            uuid references users(id),
  stripe_payment_intent_id text,
  amount                   numeric(10,2) not null,
  currency                 char(3) not null default 'GBP',
  status                   payment_status not null default 'pending',
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index idx_payments_booking on payments(booking_id);
create trigger trg_payments_updated before update on payments
  for each row execute function set_updated_at();

create table payouts (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id),
  booking_id      uuid references bookings(id),
  amount          numeric(10,2) not null,
  currency        char(3) not null default 'GBP',
  status          payout_status not null default 'pending',
  method          text,
  reference       text,
  recorded_by     uuid references users(id),
  recorded_at     timestamptz,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);
create index idx_payouts_prof on payouts(professional_id);

create table professional_payout_details (
  id                   uuid primary key default gen_random_uuid(),
  professional_id      uuid not null unique references professionals(id) on delete cascade,
  account_name         text,
  sort_code_enc        bytea,
  account_number_enc   bytea,
  account_number_last4 text,
  recorded_at          timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger trg_payout_details_updated before update on professional_payout_details
  for each row execute function set_updated_at();
