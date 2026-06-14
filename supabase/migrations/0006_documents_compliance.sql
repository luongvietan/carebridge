create table documents (
  id                  uuid primary key default gen_random_uuid(),
  professional_id     uuid not null references professionals(id) on delete cascade,
  document_type_id    uuid not null references document_types(id),
  storage_path        text not null,
  original_filename   text,
  reference_number    text,
  issuing_body        text,
  issued_date         date,
  expiry_date         date,
  verification_status document_status not null default 'pending_review',
  verified_by         uuid references users(id),
  verified_at         timestamptz,
  rejection_reason    text,
  notes               text,
  uploaded_by         uuid references users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_documents_prof   on documents(professional_id);
create index idx_documents_expiry on documents(expiry_date) where verification_status = 'approved';
create trigger trg_documents_updated before update on documents
  for each row execute function set_updated_at();

create table compliance_requirements (
  id                   uuid primary key default gen_random_uuid(),
  professional_role_id uuid not null references professional_roles(id),
  document_type_id     uuid not null references document_types(id),
  is_mandatory         boolean not null default true,
  unique (professional_role_id, document_type_id)
);

create table compliance_alerts (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  document_id     uuid references documents(id) on delete cascade,
  alert_type      text not null check (alert_type in ('expiring','expired')),
  due_date        date,
  acknowledged    boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table professional_training_records
  add constraint fk_training_cert foreign key (certificate_doc_id) references documents(id);
