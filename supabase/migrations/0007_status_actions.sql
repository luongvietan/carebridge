create table professional_status_actions (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references professionals(id),
  action_type      text not null check (action_type in
     ('suspend','compliance_hold','booking_restriction','full_suspension',
      'under_investigation','reinstate','reject','remove')),
  reason_code      text check (reason_code in
     ('last_minute_cancellation','repeated_cancellations','no_show',
      'expired_dbs','expired_training','expired_registration','expired_insurance',
      'right_to_work_concern','safeguarding_concern','client_complaint',
      'conduct_concern','missing_documents','other')),
  reason_text      text,
  internal_notes   text,
  review_date      date,
  resulting_status professional_status,
  applied_by       uuid references users(id),
  is_automatic     boolean not null default false,
  applied_at       timestamptz not null default now(),
  resolved_at      timestamptz
);
create index idx_status_actions_prof on professional_status_actions(professional_id, applied_at desc);
