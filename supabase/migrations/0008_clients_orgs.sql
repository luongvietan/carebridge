create table private_clients (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references users(id) on delete cascade,
  full_name          text not null,
  phone              text,
  email_contact      text,
  address_line1      text,
  address_line2      text,
  city               text,
  postcode           text,
  stripe_customer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_clients_updated before update on private_clients
  for each row execute function set_updated_at();

create table organisations (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references users(id) on delete cascade,
  organisation_name       text not null,
  contact_person          text,
  phone                   text,
  email_contact           text,
  address_line1           text,
  address_line2           text,
  city                    text,
  postcode                text,
  cqc_registration_number text,
  billing_email           text,
  billing_address         text,
  stripe_customer_id      text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger trg_orgs_updated before update on organisations
  for each row execute function set_updated_at();
