begin;
select plan(7);

select has_table('booking_safety_briefs');
select has_column('booking_risk_assessments', 'outcome');
select is(
  (select count(*)::int from notification_templates where type = 'booking_review_more_info'),
  2, 'more-information e-mail exists in English and Portuguese');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000f0010','bpro@test.dev'),
  ('00000000-0000-0000-0000-0000000f0011','bclient@test.dev'),
  ('00000000-0000-0000-0000-0000000f0012','bother@test.dev') on conflict do nothing;
insert into users (id, email, account_type) values
  ('00000000-0000-0000-0000-0000000f0010','bpro@test.dev','professional'),
  ('00000000-0000-0000-0000-0000000f0011','bclient@test.dev','private_client'),
  ('00000000-0000-0000-0000-0000000f0012','bother@test.dev','private_client') on conflict do nothing;
insert into professional_roles (id, code, name, is_active, category_id)
  values ('00000000-0000-0000-0000-0000000f0001','rn_brief','RN Brief', true, (select id from role_categories where code = 'healthcare')) on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values ('00000000-0000-0000-0000-0000000f0020','00000000-0000-0000-0000-0000000f0010','Pro B','00000000-0000-0000-0000-0000000f0001','active','approved')
  on conflict do nothing;
insert into private_clients (id, user_id, full_name, address_line1, city, postcode)
  values ('00000000-0000-0000-0000-0000000f0030','00000000-0000-0000-0000-0000000f0011','Client B', '1 Test Street', 'Lisboa', '1000-001') on conflict do nothing;
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee, status)
  values ('00000000-0000-0000-0000-0000000f0040','00000000-0000-0000-0000-0000000f0011',
  '00000000-0000-0000-0000-0000000f0030','00000000-0000-0000-0000-0000000f0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 25, 18, 7, 'pending_review')
  on conflict do nothing;
insert into booking_safety_briefs (booking_id, items, instructions)
  values ('00000000-0000-0000-0000-0000000f0040', '{hoist,no_manual_lifting}', 'Two-person transfer only');

-- Held for review: the professional cannot read the brief.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000f0010','role','authenticated')::text, true);
select is((select count(*)::int from booking_safety_briefs), 0, 'a professional cannot read the brief of a held request');
reset role;

-- Published: the matching professional can.
update bookings set status = 'open' where id = '00000000-0000-0000-0000-0000000f0040';
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000f0010','role','authenticated')::text, true);
select is((select count(*)::int from booking_safety_briefs), 1, 'the matching professional reads the brief once published');
reset role;

-- The requester reads it; another client cannot.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000f0011','role','authenticated')::text, true);
select is((select count(*)::int from booking_safety_briefs), 1, 'the requester reads their own brief');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000f0012','role','authenticated')::text, true);
select is((select count(*)::int from booking_safety_briefs), 0, 'another client cannot read the brief');
reset role;

select * from finish();
rollback;
