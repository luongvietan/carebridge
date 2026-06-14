create table professional_roles (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true
);

create table mandatory_training_types (
  id        uuid primary key default gen_random_uuid(),
  code      text unique not null,
  name      text not null,
  is_active boolean not null default true
);

create table document_types (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique not null,
  name                    text not null,
  category                text not null,
  is_compliance_critical  boolean not null default false,
  has_expiry              boolean not null default true,
  is_active               boolean not null default true
);
