begin;
select plan(6);
select has_column('public', 'users', 'country_code', 'Accounts retain their signup country');
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000009101','snapshot-pt@test.dev','{"account_type":"professional","market":"PT"}'),
 ('00000000-0000-0000-0000-000000009102','snapshot-gb@test.dev','{"account_type":"organisation","market":"GB"}'),
 ('00000000-0000-0000-0000-000000009103','snapshot-default@test.dev','{"account_type":"private_client"}');
select is((select country_code from public.users where id='00000000-0000-0000-0000-000000009101'),'PT','Snapshots PT signup');
select is((select country_code from public.users where id='00000000-0000-0000-0000-000000009102'),'GB','Snapshots existing GB signup');
select is((select country_code from public.users where id='00000000-0000-0000-0000-000000009103'),'PT','New missing metadata defaults to Portugal');
-- Equivalent persisted auth metadata update to auth.updateUser({data:{market:"GB"}}).
update auth.users set raw_user_meta_data=raw_user_meta_data || '{"market":"GB"}' where id='00000000-0000-0000-0000-000000009101';
select is((select country_code from public.users where id='00000000-0000-0000-0000-000000009101'),'PT','Mutable auth metadata cannot change signup snapshot');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000009101","role":"authenticated"}',true);
select throws_ok($$update public.users set country_code='GB' where id='00000000-0000-0000-0000-000000009101'$$,'42501','Account country cannot be changed.','Authenticated callers cannot change the country snapshot');
select * from finish();
rollback;
