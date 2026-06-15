begin;
select plan(4);

-- Fixtures: a role, an active+approved professional (eligible), and a pending one (ineligible).
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000b0001','rn_test','RN Test', true) on conflict do nothing;

insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000b0002','hca_test','HCA Test', true) on conflict do nothing;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000b0010','elig@test.dev'),
  ('00000000-0000-0000-0000-0000000b0011','inelig@test.dev'),
  ('00000000-0000-0000-0000-0000000b0012','wrongrole@test.dev') on conflict do nothing;

insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values
  ('00000000-0000-0000-0000-0000000b0020','00000000-0000-0000-0000-0000000b0010','Elig Pro','00000000-0000-0000-0000-0000000b0001','active','approved'),
  ('00000000-0000-0000-0000-0000000b0021','00000000-0000-0000-0000-0000000b0011','Inelig Pro','00000000-0000-0000-0000-0000000b0001','pending_verification','pending_review'),
  ('00000000-0000-0000-0000-0000000b0022','00000000-0000-0000-0000-0000000b0012','Wrong Role Pro','00000000-0000-0000-0000-0000000b0002','active','approved')
  on conflict do nothing;

insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000b0030','00000000-0000-0000-0000-0000000b0010','Client') on conflict do nothing;

-- An open booking (no assignee -> trigger is a no-op on insert).
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
  values ('00000000-0000-0000-0000-0000000b0040','00000000-0000-0000-0000-0000000b0010',
  '00000000-0000-0000-0000-0000000b0030','00000000-0000-0000-0000-0000000b0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12)
  on conflict do nothing;

-- Assigning an ineligible professional must raise.
select throws_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000b0021'
     where id='00000000-0000-0000-0000-0000000b0040' $$,
  'professional not eligible to accept bookings');

-- Assigning an eligible professional must succeed (can_accept_bookings is derived from active+approved).
select lives_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000b0020'
     where id='00000000-0000-0000-0000-0000000b0040' $$);

-- Role mismatch must raise even when the professional is otherwise eligible.
select lives_ok(
  $$ update bookings set assigned_professional_id = null where id='00000000-0000-0000-0000-0000000b0040' $$);
select throws_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000b0022'
     where id='00000000-0000-0000-0000-0000000b0040' $$,
  'professional role does not match booking');

select * from finish();
rollback;
