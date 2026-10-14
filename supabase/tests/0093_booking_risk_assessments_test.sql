begin;
select plan(9);

select has_table('booking_risk_assessments');
select ok('pending_review' = any(enum_range(null::booking_status)::text[]), 'booking_status has pending_review');
select is(
  (select count(*)::int from notification_templates
    where type in ('booking_under_review','booking_review_approved','booking_review_declined','booking_review_required')),
  8, 'review e-mails exist in English and Portuguese');

-- Fixtures: a professional of the booked role, the requesting client, another client.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000e0010','rpro@test.dev'),
  ('00000000-0000-0000-0000-0000000e0011','rclient@test.dev'),
  ('00000000-0000-0000-0000-0000000e0012','rother@test.dev') on conflict do nothing;
insert into users (id, email, account_type) values
  ('00000000-0000-0000-0000-0000000e0010','rpro@test.dev','professional'),
  ('00000000-0000-0000-0000-0000000e0011','rclient@test.dev','private_client'),
  ('00000000-0000-0000-0000-0000000e0012','rother@test.dev','private_client') on conflict do nothing;
insert into professional_roles (id, code, name, is_active, category_id)
  values ('00000000-0000-0000-0000-0000000e0001','rn_risk','RN Risk', true, (select id from role_categories where code = 'healthcare')) on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values ('00000000-0000-0000-0000-0000000e0020','00000000-0000-0000-0000-0000000e0010','Pro R','00000000-0000-0000-0000-0000000e0001','active','approved')
  on conflict do nothing;
insert into private_clients (id, user_id, full_name, address_line1, city, postcode)
  values ('00000000-0000-0000-0000-0000000e0030','00000000-0000-0000-0000-0000000e0011','Client R', '1 Test Street', 'Lisboa', '1000-001') on conflict do nothing;
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee, status)
  values ('00000000-0000-0000-0000-0000000e0040','00000000-0000-0000-0000-0000000e0011',
  '00000000-0000-0000-0000-0000000e0030','00000000-0000-0000-0000-0000000e0001',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 25, 18, 7, 'pending_review')
  on conflict do nothing;
insert into booking_risk_assessments (booking_id, questionnaire_version, respondent, answers, score,
  risk_level, recommended_role_family, requires_review, review_reasons, consent_at, created_by)
  values ('00000000-0000-0000-0000-0000000e0040','test','family','{"behaviour":"often"}'::jsonb, 4,
  'high','nurse_adult', true, '{behaviour_risk}', now(), '00000000-0000-0000-0000-0000000e0011');

-- The professional cannot see the held request, nor its assessment.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000e0010','role','authenticated')::text, true);
select is((select count(*)::int from bookings where id = '00000000-0000-0000-0000-0000000e0040'), 0,
  'a professional cannot see a request held for review');
select is((select count(*)::int from booking_risk_assessments), 0, 'a professional cannot read risk assessments');
reset role;

-- Once approved (open), the matching professional sees the booking.
update bookings set status = 'open' where id = '00000000-0000-0000-0000-0000000e0040';
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000e0010','role','authenticated')::text, true);
select is((select count(*)::int from bookings where id = '00000000-0000-0000-0000-0000000e0040'), 1,
  'the matching professional sees the request once approved');
reset role;

-- The requester reads their own assessment; another client cannot.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000e0011','role','authenticated')::text, true);
select is((select count(*)::int from booking_risk_assessments), 1, 'the requester reads their own assessment');
select throws_ok(
  $$insert into booking_risk_assessments (booking_id, questionnaire_version, respondent, answers, score,
      risk_level, recommended_role_family, requires_review, consent_at, created_by)
    values ('00000000-0000-0000-0000-0000000e0040','x','self','{}'::jsonb,0,'low','support',false,now(),
      '00000000-0000-0000-0000-0000000e0011')$$,
  '42501', null, 'a client cannot write an assessment directly');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000e0012','role','authenticated')::text, true);
select is((select count(*)::int from booking_risk_assessments), 0, 'another client cannot read the assessment');
reset role;

select * from finish();
rollback;
