begin;
select plan(2);

select has_function('public','handle_new_user','new-user trigger fn exists');

insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000d7','d7@test.dev',
        '{"account_type":"professional","full_name":"Trigger Pro"}'::jsonb);

select is( (select account_type::text from public.users where id='00000000-0000-0000-0000-0000000000d7'),
           'professional', 'public.users row created from signup metadata');

select * from finish();
rollback;
