begin;
select plan(5);

select has_table('professionals');
select fk_ok('public','professionals','user_id','public','users','id');
select has_column('professionals','can_accept_bookings');

-- Behavioural: generated column logic
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001','p1@test.dev');
insert into users (id, email, account_type) values ('00000000-0000-0000-0000-000000000001','p1@test.dev','professional');
insert into professionals (user_id, full_name, professional_status, compliance_status)
  values ('00000000-0000-0000-0000-000000000001','Test Pro','active','approved')
  returning id as pid \gset
select is( (select can_accept_bookings from professionals where id = :'pid'), true,
           'active + approved => can_accept_bookings true');
update professionals set professional_status='temporarily_suspended' where id = :'pid';
select is( (select can_accept_bookings from professionals where id = :'pid'), false,
           'suspended => can_accept_bookings false');

select * from finish();
rollback;
