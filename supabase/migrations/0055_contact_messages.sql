-- Spec §12: the public Contact form previously posted to a `mailto:` action,
-- which most browsers silently drop — submissions were lost. Persist them to a
-- durable table the founder/admin can read. Inserts come from the server action
-- via the service role (bypasses RLS); reads are admin-only.
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy contact_messages_admin_read on contact_messages
  for select using (public.is_admin());
