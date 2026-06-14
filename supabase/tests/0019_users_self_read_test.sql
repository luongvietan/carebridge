begin;
select plan(1);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c9','c9@test.dev','{"account_type":"professional"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000ca','ca@test.dev','{"account_type":"professional"}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000c9","role":"authenticated"}', true);
select count(*)::int as n from users \gset
reset role;

select is( :n, 1, 'authenticated user reads only their own users row' );

select * from finish();
rollback;
