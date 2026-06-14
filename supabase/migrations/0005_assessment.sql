create table eligibility_screenings (
  id                 uuid primary key default gen_random_uuid(),
  professional_id    uuid not null references professionals(id) on delete cascade,
  employment_status  employment_status not null,
  training_current   boolean not null,
  outcome            text not null check (outcome in ('continue','pending')),
  submitted_at       timestamptz not null default now()
);

create table professional_training_records (
  id                  uuid primary key default gen_random_uuid(),
  professional_id     uuid not null references professionals(id) on delete cascade,
  training_type_id    uuid not null references mandatory_training_types(id),
  completed_date      date,
  expiry_date         date,
  certificate_doc_id  uuid,                 -- FK added in 0006 once documents exists
  created_at          timestamptz not null default now(),
  unique (professional_id, training_type_id)
);

create table assessment_question_bank (
  id                   uuid primary key default gen_random_uuid(),
  professional_role_id uuid references professional_roles(id),
  topic                assessment_topic not null,
  question_text        text not null,
  options              jsonb not null,
  correct_option       text not null,
  weight               numeric(4,2) not null default 1,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create table assessment_attempts (
  id                  uuid primary key default gen_random_uuid(),
  professional_id     uuid not null references professionals(id) on delete cascade,
  attempt_number      smallint not null check (attempt_number between 1 and 3),
  served_question_ids jsonb not null,
  score               numeric(5,2),
  passed              boolean,
  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  unique (professional_id, attempt_number)
);

create table assessment_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references assessment_attempts(id) on delete cascade,
  question_id     uuid not null references assessment_question_bank(id),
  selected_option text,
  is_correct      boolean
);
