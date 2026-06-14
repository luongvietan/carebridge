create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  account_type  account_type not null,
  is_founder    boolean not null default false,
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

create table consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  consent_type text not null check (consent_type in ('privacy_policy','terms_conditions','gdpr_data_handling')),
  version      text not null,
  accepted_at  timestamptz not null default now(),
  ip_address   inet
);
create index idx_consents_user on consents(user_id);
