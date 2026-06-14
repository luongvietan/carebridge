begin;
select plan(3);

-- RLS enabled on key tables
select is( (select relrowsecurity from pg_class where relname='professionals'), true, 'RLS on professionals');
select is( (select relrowsecurity from pg_class where relname='documents'), true, 'RLS on documents');

-- Fixtures: two professionals
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1','a@test.dev','{"account_type":"professional"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000b2','b@test.dev','{"account_type":"professional"}'::jsonb);
insert into professionals (user_id, full_name) values
  ('00000000-0000-0000-0000-0000000000a1','Pro A'),
  ('00000000-0000-0000-0000-0000000000b2','Pro B');

-- Capture the visible row count AS professional A (RLS applies), via \gset,
-- then reset role before asserting so pgTAP runs as the privileged session role.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select count(*)::int as a_visible from professionals \gset
reset role;

select is( :a_visible, 1, 'professional A sees only own row under RLS');

select * from finish();
rollback;
