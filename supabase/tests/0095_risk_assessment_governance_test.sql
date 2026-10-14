begin;
select plan(9);

select has_column('users', 'is_clinical_reviewer');
select is((select count(*)::int from users where is_clinical_reviewer), 0, 'no account is a clinical reviewer by default');

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000a9011','rclient95@test.dev') on conflict do nothing;
insert into users (id, email, account_type) values ('00000000-0000-0000-0000-0000000a9011','rclient95@test.dev','private_client') on conflict do nothing;
insert into professional_roles (id, code, name, is_active, category_id)
  values ('00000000-0000-0000-0000-0000000a9001','rn_ret','RN Retention', true, (select id from role_categories where code = 'healthcare')) on conflict do nothing;
insert into private_clients (id, user_id, full_name, address_line1, city, postcode)
  values ('00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9011','Client R', '1 Test Street', 'Lisboa', '1000-001') on conflict do nothing;

-- b1 cancelled 40 days ago (abandoned → delete); b2 cancelled 10 days ago (keep);
-- b3 completed 4 years ago (expired → delete); b4 completed 4 years ago with an
-- open incident (keep); b5 held and never served, on legal hold (keep);
-- b6 completed a year ago (keep).
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee, status, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000a9041','00000000-0000-0000-0000-0000000a9011','00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9001',
   now() - interval '50 days', now() - interval '50 days' + interval '2 hours', 2, 'b1', 25, 18, 7, 'cancelled', now() - interval '60 days', now() - interval '40 days'),
  ('00000000-0000-0000-0000-0000000a9042','00000000-0000-0000-0000-0000000a9011','00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9001',
   now() + interval '5 days', now() + interval '5 days 2 hours', 2, 'b2', 25, 18, 7, 'cancelled', now() - interval '20 days', now() - interval '10 days'),
  ('00000000-0000-0000-0000-0000000a9043','00000000-0000-0000-0000-0000000a9011','00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9001',
   now() - interval '4 years', now() - interval '4 years' + interval '2 hours', 2, 'b3', 25, 18, 7, 'completed', now() - interval '4 years', now() - interval '4 years'),
  ('00000000-0000-0000-0000-0000000a9044','00000000-0000-0000-0000-0000000a9011','00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9001',
   now() - interval '4 years', now() - interval '4 years' + interval '2 hours', 2, 'b4', 25, 18, 7, 'completed', now() - interval '4 years', now() - interval '4 years'),
  ('00000000-0000-0000-0000-0000000a9045','00000000-0000-0000-0000-0000000a9011','00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9001',
   now() - interval '60 days', now() - interval '60 days' + interval '2 hours', 2, 'b5', 25, 18, 7, 'pending_review', now() - interval '70 days', now() - interval '70 days'),
  ('00000000-0000-0000-0000-0000000a9046','00000000-0000-0000-0000-0000000a9011','00000000-0000-0000-0000-0000000a9030','00000000-0000-0000-0000-0000000a9001',
   now() - interval '1 year', now() - interval '1 year' + interval '2 hours', 2, 'b6', 25, 18, 7, 'completed', now() - interval '1 year', now() - interval '1 year');

insert into booking_risk_assessments (booking_id, questionnaire_version, respondent, answers, score,
  risk_level, recommended_role_family, requires_review, consent_at, created_by, retention_hold)
select b.id, 'test', 'self', '{}'::jsonb, 0, 'green', 'support', false, now(), '00000000-0000-0000-0000-0000000a9011', b.location_address = 'b5'
  from bookings b where b.id::text like '00000000-0000-0000-0000-0000000a904%';
insert into booking_safety_briefs (booking_id, items)
select id, '{falls}' from bookings where id::text like '00000000-0000-0000-0000-0000000a904%';

-- The client of b4 has an open complaint about that booking.
insert into incidents (reference, category, subject, details, booking_id, private_client_id)
  values ('INC-RET-TEST', 'complaint', 'Complaint', 'Open complaint', '00000000-0000-0000-0000-0000000a9044', null);

-- Totals can include other fixtures, so the per-booking checks below decide.
select ok(
  (select (r->>'abandoned')::int >= 1 and (r->>'expired')::int >= 1 from (select public.fn_purge_risk_assessments() as r) x),
  'the purge reports abandoned and expired deletions');
select is((select count(*)::int from booking_risk_assessments where booking_id = '00000000-0000-0000-0000-0000000a9041'), 0, 'cancelled 40 days ago: deleted');
select is((select count(*)::int from booking_risk_assessments where booking_id = '00000000-0000-0000-0000-0000000a9043'), 0, 'served 4 years ago: deleted');
select is((select count(*)::int from booking_safety_briefs where booking_id in ('00000000-0000-0000-0000-0000000a9041','00000000-0000-0000-0000-0000000a9043')), 0, 'their safety briefs are deleted too');
select is(
  (select array_agg(b.location_address order by b.location_address) from booking_risk_assessments ra join bookings b on b.id = ra.booking_id
    where b.id::text like '00000000-0000-0000-0000-0000000a904%'),
  array['b2','b4','b5','b6'], 'recent, open-incident, held and in-period assessments are kept');
select ok(exists (select 1 from audit_log where action = 'risk_assessment.purged'), 'the purge is written to the audit log');
set local role authenticated;
select throws_ok('select public.fn_purge_risk_assessments()', '42501', null, 'signed-in users cannot run the purge');
reset role;

select * from finish();
rollback;
