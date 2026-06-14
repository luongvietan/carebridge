create table professionals (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references users(id) on delete cascade,
  full_name               text not null,
  date_of_birth           date,
  address_line1           text,
  address_line2           text,
  city                    text,
  postcode                text,
  national_insurance_no   text,
  professional_role_id    uuid references professional_roles(id),
  professional_summary    text,
  travel_distance_km      integer,
  has_driving_licence     boolean,
  has_vehicle             boolean,
  profile_photo_path      text,
  employment_status       employment_status,
  professional_status     professional_status not null default 'pending_verification',
  compliance_status       compliance_status   not null default 'pending_review',
  can_accept_bookings     boolean generated always as
                            (professional_status = 'active' and compliance_status = 'approved') stored,
  assessment_locked_until date,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index idx_prof_role   on professionals(professional_role_id);
create index idx_prof_status  on professionals(professional_status);
create index idx_prof_comp    on professionals(compliance_status);
create trigger trg_prof_updated before update on professionals
  for each row execute function set_updated_at();

create table professional_skills (
  professional_id uuid not null references professionals(id) on delete cascade,
  skill_id        uuid not null references skills(id),
  primary key (professional_id, skill_id)
);

create table professional_availability (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  day_of_week     smallint check (day_of_week between 0 and 6),
  start_time      time,
  end_time        time
);
