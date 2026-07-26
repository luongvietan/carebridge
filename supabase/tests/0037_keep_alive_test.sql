begin;
select plan(8);

select has_table('public', 'keep_alive', 'keep_alive heartbeat table exists');
select has_function('public', 'keep_alive_ping', 'keep_alive_ping function exists');

-- Exactly one heartbeat row, and the check constraint keeps it that way.
select is((select count(*)::int from keep_alive), 1, 'keep_alive holds a single row');
select throws_ok(
  $$insert into keep_alive (id) values (2)$$,
  '23514',
  null,
  'a second heartbeat row is rejected');

-- A stale heartbeat is refreshed to the current transaction time.
update keep_alive set last_ping_at = now() - interval '10 days';
select is(public.keep_alive_ping(), now(), 'keep_alive_ping returns the new heartbeat');
select is((select last_ping_at from keep_alive), now(), 'the refreshed heartbeat is persisted');

-- The cron job authenticates with the public anon key: it must be able to ping,
-- but must not be able to read the table directly.
set local role anon;
select lives_ok($$select public.keep_alive_ping()$$, 'anon can call keep_alive_ping');
select throws_ok(
  $$select last_ping_at from keep_alive$$,
  '42501',
  null,
  'anon cannot read keep_alive directly');
reset role;

select * from finish();
rollback;
