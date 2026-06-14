begin;
select plan(5);

select has_table('bookings');
select has_table('booking_status_history');
select has_table('booking_cancellations');

-- Behavioural: snapshot totals are frozen
insert into auth.users (id, email, raw_user_meta_data)
  values ('00000000-0000-0000-0000-0000000000c1','c1@test.dev','{"account_type":"private_client"}'::jsonb);
insert into private_clients (id, user_id, full_name)
  values ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000c1','Client One');
insert into professional_roles (id, code, name)
  values ('00000000-0000-0000-0000-0000000000a1','rn_book_test','Registered Nurse (booking test)');
insert into rate_cards (id, professional_role_id, client_charge_rate, professional_payout_rate)
  values ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1', 40, 28);

insert into bookings
  (requester_user_id, private_client_id, professional_role_id, scheduled_start, scheduled_end,
   duration_hours, location_address, rate_card_id,
   snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
values
  ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000d1',
   '00000000-0000-0000-0000-0000000000a1', now(), now() + interval '5 hours',
   5, '1 Test St', '00000000-0000-0000-0000-0000000000b1', 40, 28, 12)
returning id as bid \gset

select is( (select total_client_charge from bookings where id = :'bid'), 200.00::numeric,
           '5h x £40 = £200 client charge');

-- mutate the source rate card; booking total must stay frozen
update rate_cards set client_charge_rate = 99 where id = '00000000-0000-0000-0000-0000000000b1';
select is( (select total_client_charge from bookings where id = :'bid'), 200.00::numeric,
           'rate change does not alter snapshotted booking total');

select * from finish();
rollback;
