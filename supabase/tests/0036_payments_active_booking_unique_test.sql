begin;
select plan(2);

-- Fixtures: a role, a client, and an open booking to pay for.
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000d0001','rn_d','RN D', true) on conflict do nothing;

insert into auth.users (id, email)
  values ('00000000-0000-0000-0000-0000000d0010','pay@test.dev') on conflict do nothing;

insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000d0030','00000000-0000-0000-0000-0000000d0010','Pay Client')
  on conflict do nothing;

insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
  values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0010',
  '00000000-0000-0000-0000-0000000d0030','00000000-0000-0000-0000-0000000d0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Pay St', 40, 28, 12)
  on conflict do nothing;

-- First (pending) payment for the booking.
insert into payments (id, booking_id, payer_user_id, amount, currency, status)
  values ('00000000-0000-0000-0000-0000000d0050','00000000-0000-0000-0000-0000000d0040',
          '00000000-0000-0000-0000-0000000d0010',480,'GBP','pending');

-- A concurrent second active (pending) payment for the same booking must be
-- rejected by uq_payments_active_booking — this is the double-charge guard.
select throws_ok(
  $$ insert into payments (booking_id, payer_user_id, amount, currency, status)
     values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0010',480,'GBP','pending') $$,
  '23505', null,
  'a second active payment for the same booking is rejected');

-- Once the first payment has failed, a fresh payment may be started (retry path).
update payments set status='failed' where id='00000000-0000-0000-0000-0000000d0050';
select lives_ok(
  $$ insert into payments (booking_id, payer_user_id, amount, currency, status)
     values ('00000000-0000-0000-0000-0000000d0040','00000000-0000-0000-0000-0000000d0010',480,'GBP','pending') $$,
  'a new payment can be started after the previous one failed');

select * from finish();
rollback;
