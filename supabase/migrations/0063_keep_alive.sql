-- Supabase pauses a free-tier project after 7 consecutive days with no database
-- activity; restoring it is a manual click, so the app would sit offline until
-- somebody noticed. A scheduled GitHub Action (.github/workflows/keep-alive.yml)
-- calls public.keep_alive_ping() every 3 days, guaranteeing a real write well
-- inside that window.
--
-- The heartbeat is a single fixed row, not an append-only log. The ping runs with
-- the publishable anon key (so no service-role secret has to live in CI), which
-- means anyone holding that public key can call it — bounding the effect to one
-- timestamp keeps the table from growing and leaves nothing worth reading.
create table keep_alive (
  id           smallint primary key default 1 check (id = 1),
  last_ping_at timestamptz not null default now()
);

insert into keep_alive (id) values (1);

-- No policies, and no privileges for the API roles: the table itself is
-- unreachable through the Data API. Only the security definer function below
-- (and the service role, which bypasses RLS) can touch it. The revoke is
-- belt-and-braces — it also holds if `auto_expose_new_tables` is ever enabled.
alter table keep_alive enable row level security;
revoke all on keep_alive from anon, authenticated;

create function public.keep_alive_ping()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update keep_alive set last_ping_at = now() where id = 1
  returning last_ping_at;
$$;

revoke execute on function public.keep_alive_ping() from public;
grant execute on function public.keep_alive_ping() to anon, authenticated, service_role;
