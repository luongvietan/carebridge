begin;
select plan(4);

select has_table('booking_declines');
select ok(
  (select count(*) from pg_policies where schemaname='public' and tablename='booking_declines') >= 2,
  'booking_declines has RLS policies');
select col_is_unique('booking_declines', array['booking_id','professional_id']);

-- RLS isolation: pro A cannot read pro B's decline row.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000d0010','proa@test.dev'),
  ('00000000-0000-0000-0000-0000000d0011','prob@test.dev') on conflict do nothing;
insert into users (id, email, account_type) values
  ('00000000-0000-0000-0000-0000000d0010','proa@test.dev','professional'),
  ('00000000-0000-0000-0000-0000000d0011','prob@test.dev','professional') on conflict do nothing;
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000d0001','rn_d','RN D', true) on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values
  ('00000000-0000-0000-0000-0000000d0020','00000000-0000-0000-0000-0000000d0010','Pro A','00000000-0000-0000-0000-0000000d0001','active','approved'),
  ('00000000-0000-0000-0000-0000000d0021','00000000-0000-0000-0000-0000000d0011','Pro B','00000000-0000-0000-0000-0000000d0001','active','approved')
  on conflict do nothing;
insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000d0030','00000000-0000-0000-0000-0000000d0010','Client') on conflict do nothing;
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
  values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0010',
  '00000000-0000-0000-0000-0000000d0030','00000000-0000-0000-0000-0000000d0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12)
  on conflict do nothing;
insert into booking_declines (booking_id, professional_id)
  values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0020');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000d0011')::text, true);

select is(
  (select count(*)::int from booking_declines where professional_id = '00000000-0000-0000-0000-0000000d0020'),
  0,
  'professional B cannot see professional A decline row');

select * from finish();
rollback;
