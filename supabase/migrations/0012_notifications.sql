create table notification_templates (
  id      uuid primary key default gen_random_uuid(),
  type    text unique not null check (type in
            ('registration_confirmation','email_verification','assessment_result',
             'compliance_approval','compliance_expiry_reminder','booking_request',
             'booking_confirmation','password_reset')),
  subject text not null,
  body    text not null
);

create table notifications (
  id                uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references users(id) on delete cascade,
  type              text not null,
  channel           text not null default 'email',
  payload           jsonb,
  status            text not null default 'queued' check (status in ('queued','sent','failed')),
  related_entity    text,
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_user_id);
