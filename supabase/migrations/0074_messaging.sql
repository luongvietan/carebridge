-- Client request, 7 August 2026: "a secure Messaging Centre for communication
-- between administrators, professionals and clients, with all messages logged".
--
-- Threads with explicit participants rather than a free-for-all inbox: a
-- message belongs to a conversation, and who can read that conversation is a
-- row, not a guess from the message body. Administrators can read and join any
-- thread — that is what "all messages logged" means on a platform that has to
-- answer for safeguarding — and the participants can see each other, so nobody
-- is talking to an audience they cannot see.

create table if not exists message_threads (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  -- Optional context so a thread can be about a specific booking or person.
  booking_id       uuid references bookings(id) on delete set null,
  professional_id  uuid references professionals(id) on delete set null,
  created_by   uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  closed_at    timestamptz
);

create table if not exists thread_participants (
  thread_id  uuid not null references message_threads(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references message_threads(id) on delete cascade,
  sender_user_id uuid not null references users(id) on delete cascade,
  body        text not null check (length(btrim(body)) > 0),
  created_at  timestamptz not null default now()
);

create index if not exists idx_messages_thread on messages(thread_id, created_at);
create index if not exists idx_threads_recent on message_threads(last_message_at desc);
create index if not exists idx_participants_user on thread_participants(user_id);

alter table message_threads enable row level security;
alter table thread_participants enable row level security;
alter table messages enable row level security;

-- A participant reads their own threads; an administrator reads all of them.
-- Note the participant check is a plain exists() against thread_participants
-- rather than a join back through message_threads, which would recurse.
drop policy if exists threads_read on message_threads;
create policy threads_read on message_threads
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from thread_participants tp
       where tp.thread_id = message_threads.id and tp.user_id = auth.uid()
    )
  );

drop policy if exists participants_read on thread_participants;
create policy participants_read on thread_participants
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from thread_participants mine
       where mine.thread_id = thread_participants.thread_id and mine.user_id = auth.uid()
    )
  );

drop policy if exists messages_read on messages;
create policy messages_read on messages
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from thread_participants tp
       where tp.thread_id = messages.thread_id and tp.user_id = auth.uid()
    )
  );

-- Writes go through server actions using the service role, which check
-- participation explicitly; no client-side insert policy is granted, so a
-- message can never be posted into somebody else's thread from the browser.
grant select on message_threads, thread_participants, messages to authenticated;
grant all on message_threads, thread_participants, messages to service_role;

/* -------------------------------------------------------------- export ---- */

create or replace view v_export_messages
with (security_invoker = true) as
select m.id, t.subject, t.booking_id, u.email as sender, m.body, m.created_at
  from messages m
  join message_threads t on t.id = m.thread_id
  left join users u on u.id = m.sender_user_id;

revoke all on public.v_export_messages from anon, authenticated;
grant select on public.v_export_messages to service_role;
