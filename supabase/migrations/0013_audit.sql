create table audit_log (
  id            bigint generated always as identity primary key,
  occurred_at   timestamptz not null default now(),
  actor_user_id uuid references users(id),
  actor_type    text not null default 'user' check (actor_type in ('user','admin','system')),
  action        text not null,
  entity_type   text not null,
  entity_id     text not null,
  summary       text,
  changes       jsonb,
  ip_address    inet,
  user_agent    text
);
create index idx_audit_entity on audit_log(entity_type, entity_id);
create index idx_audit_actor  on audit_log(actor_user_id, occurred_at desc);

create rule audit_no_update as on update to audit_log do instead nothing;
create rule audit_no_delete as on delete to audit_log do instead nothing;
