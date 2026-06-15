begin;
select plan(2);

-- Fixtures: open booking + two eligible professionals (same role).
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000c0001','rn_c','RN C', true) on conflict do nothing;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000c0010','req@test.dev'),
  ('00000000-0000-0000-0000-0000000c0011','pro1@test.dev'),
  ('00000000-0000-0000-0000-0000000c0012','pro2@test.dev') on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values
  ('00000000-0000-0000-0000-0000000c0020','00000000-0000-0000-0000-0000000c0011','Pro 1','00000000-0000-0000-0000-0000000c0001','active','approved'),
  ('00000000-0000-0000-0000-0000000c0021','00000000-0000-0000-0000-0000000c0012','Pro 2','00000000-0000-0000-0000-0000000c0001','active','approved')
  on conflict do nothing;
insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000c0030','00000000-0000-0000-0000-0000000c0010','Client') on conflict do nothing;
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee, status)
  values ('00000000-0000-0000-0000-0000000c0040','00000000-0000-0000-0000-0000000c0010',
  '00000000-0000-0000-0000-0000000c0030','00000000-0000-0000-0000-0000000c0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12, 'open')
  on conflict do nothing;

-- First accept wins.
update bookings
   set status = 'accepted', assigned_professional_id = '00000000-0000-0000-0000-0000000c0020', accepted_at = now()
 where id = '00000000-0000-0000-0000-0000000c0040'
   and status = 'open'
   and assigned_professional_id is null;
select is(
  (select status::text from bookings where id = '00000000-0000-0000-0000-0000000c0040'),
  'accepted',
  'first accept succeeds');

-- Second accept on non-open booking is a no-op (mirrors app conditional update).
update bookings
   set status = 'accepted', assigned_professional_id = '00000000-0000-0000-0000-0000000c0021', accepted_at = now()
 where id = '00000000-0000-0000-0000-0000000c0040'
   and status = 'open'
   and assigned_professional_id is null;
select is(
  (select assigned_professional_id from bookings where id = '00000000-0000-0000-0000-0000000c0040'),
  '00000000-0000-0000-0000-0000000c0020'::uuid,
  'second accept does not steal assignment');

select * from finish();
rollback;
