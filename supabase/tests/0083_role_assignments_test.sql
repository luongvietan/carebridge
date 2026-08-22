begin;
select plan(13);

/* -------------------------------------------------------------- fixtures --- */

-- Two roles with no register and no critical documents, so eligibility turns on
-- exactly one thing here: the assessment for that role.
insert into professional_roles (id, code, name, is_active, category_id) values
  ('00000000-0000-0000-0000-0000000e0001','ra_nurse_test','RA Nurse Test', true,
   (select id from role_categories where code = 'healthcare')),
  ('00000000-0000-0000-0000-0000000e0002','ra_nanny_test','RA Nanny Test', true,
   (select id from role_categories where code = 'healthcare'))
  on conflict do nothing;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000e0010','dualrole@test.dev'),
  ('00000000-0000-0000-0000-0000000e0011','singlerole@test.dev')
  on conflict do nothing;

insert into professionals (id, user_id, full_name, professional_role_id,
                           professional_status, compliance_status) values
  ('00000000-0000-0000-0000-0000000e0020','00000000-0000-0000-0000-0000000e0010',
   'Dual Role Pro','00000000-0000-0000-0000-0000000e0001','active','approved'),
  ('00000000-0000-0000-0000-0000000e0021','00000000-0000-0000-0000-0000000e0011',
   'Single Role Pro','00000000-0000-0000-0000-0000000e0002','active','approved')
  on conflict do nothing;

/* ------------------------------------------------- the column syncs both ways */

select is(
  (select count(*)::int from professional_role_assignments
    where professional_id = '00000000-0000-0000-0000-0000000e0020' and is_primary),
  1,
  'inserting a professional with a role creates exactly one primary assignment');

select is(
  (select professional_role_id from professional_role_assignments
    where professional_id = '00000000-0000-0000-0000-0000000e0020' and is_primary),
  '00000000-0000-0000-0000-0000000e0001'::uuid,
  'the primary assignment points at the role the professional was created with');

select is(
  (select status::text from professional_role_assignments
    where professional_id = '00000000-0000-0000-0000-0000000e0020' and is_primary),
  'active',
  'an active, approved professional starts with an active primary role');

-- The other direction: making a second assignment primary re-points the column.
insert into professional_role_assignments (professional_id, professional_role_id, status)
  values ('00000000-0000-0000-0000-0000000e0020',
          '00000000-0000-0000-0000-0000000e0002','pending');

update professional_role_assignments set is_primary = false
 where professional_id = '00000000-0000-0000-0000-0000000e0020'
   and professional_role_id = '00000000-0000-0000-0000-0000000e0001';
update professional_role_assignments set is_primary = true
 where professional_id = '00000000-0000-0000-0000-0000000e0020'
   and professional_role_id = '00000000-0000-0000-0000-0000000e0002';

select is(
  (select professional_role_id from professionals
    where id = '00000000-0000-0000-0000-0000000e0020'),
  '00000000-0000-0000-0000-0000000e0002'::uuid,
  'promoting an assignment to primary re-points professionals.professional_role_id');

-- Put it back the way the rest of this file expects.
update professional_role_assignments set is_primary = false
 where professional_id = '00000000-0000-0000-0000-0000000e0020'
   and professional_role_id = '00000000-0000-0000-0000-0000000e0002';
update professional_role_assignments set is_primary = true
 where professional_id = '00000000-0000-0000-0000-0000000e0020'
   and professional_role_id = '00000000-0000-0000-0000-0000000e0001';

select throws_ok(
  $$ update professional_role_assignments set is_primary = true
      where professional_id = '00000000-0000-0000-0000-0000000e0020'
        and professional_role_id = '00000000-0000-0000-0000-0000000e0002' $$,
  23505,
  null,
  'a professional cannot have two primary roles');

/* --------------------------------------------- eligibility is per role ---- */

select ok(
  not public.fn_role_assignment_eligible(
    '00000000-0000-0000-0000-0000000e0020','00000000-0000-0000-0000-0000000e0002'),
  'a role whose assessment has not been passed is not eligible');

insert into assessment_attempts
  (professional_id, professional_role_id, attempt_number, served_question_ids,
   score, passed, completed_at)
values
  ('00000000-0000-0000-0000-0000000e0020','00000000-0000-0000-0000-0000000e0001',
   1, '[]'::jsonb, 90, true, now());

select ok(
  public.fn_role_assignment_eligible(
    '00000000-0000-0000-0000-0000000e0020','00000000-0000-0000-0000-0000000e0001'),
  'passing the assessment for a role makes that role eligible');

select ok(
  not public.fn_role_assignment_eligible(
    '00000000-0000-0000-0000-0000000e0020','00000000-0000-0000-0000-0000000e0002'),
  'passing one role''s assessment does not carry over to another role');

-- The attempt counter runs per role, so a first attempt at the second role is
-- allowed while a first attempt at the first role already exists.
select lives_ok(
  $$ insert into assessment_attempts
       (professional_id, professional_role_id, attempt_number, served_question_ids)
     values ('00000000-0000-0000-0000-0000000e0020',
             '00000000-0000-0000-0000-0000000e0002', 1, '[]'::jsonb) $$,
  'attempt 1 may exist once per role, not once per professional');

/* ------------------------------------------------- the booking guard ------ */

insert into private_clients (id, user_id, full_name, address_line1, city, postcode)
  values ('00000000-0000-0000-0000-0000000e0030','00000000-0000-0000-0000-0000000e0010',
          'RA Client','1 Test Street','Manchester','M1 1AA') on conflict do nothing;

-- A booking for the SECOND role, which this professional holds but has not yet
-- had activated.
insert into bookings (id, requester_user_id, private_client_id, professional_role_id,
  scheduled_start, scheduled_end, duration_hours, location_address,
  snap_client_charge_rate, snap_payout_rate, snap_platform_fee)
  values ('00000000-0000-0000-0000-0000000e0040','00000000-0000-0000-0000-0000000e0010',
  '00000000-0000-0000-0000-0000000e0030','00000000-0000-0000-0000-0000000e0002',
  now() + interval '2 days', now() + interval '2 days 8 hours', 8, '1 Test St', 40, 28, 12)
  on conflict do nothing;

select throws_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000e0020'
      where id='00000000-0000-0000-0000-0000000e0040' $$,
  'professional role does not match booking',
  'holding a role is not enough — it has to be active');

update professional_role_assignments set status = 'active'
 where professional_id = '00000000-0000-0000-0000-0000000e0020'
   and professional_role_id = '00000000-0000-0000-0000-0000000e0002';

select lives_ok(
  $$ update bookings set assigned_professional_id='00000000-0000-0000-0000-0000000e0020'
      where id='00000000-0000-0000-0000-0000000e0040' $$,
  'a professional may be assigned a booking in a second, active role');

/* ------------------------------------------- the sweep restricts one role - */

-- Give the second role a critical document requirement nobody has satisfied.
insert into document_types (id, code, name, category, is_compliance_critical)
  values ('00000000-0000-0000-0000-0000000e0050','ra_test_dbs','RA Test DBS','identity', true)
  on conflict do nothing;
insert into compliance_requirements (professional_role_id, document_type_id)
  values ('00000000-0000-0000-0000-0000000e0002','00000000-0000-0000-0000-0000000e0050')
  on conflict do nothing;

select public.fn_run_compliance_sweep();

select is(
  (select status::text from professional_role_assignments
    where professional_id = '00000000-0000-0000-0000-0000000e0020'
      and professional_role_id = '00000000-0000-0000-0000-0000000e0002'),
  'restricted',
  'the sweep restricts the role that is missing a critical document');

select is(
  (select professional_status::text from professionals
    where id = '00000000-0000-0000-0000-0000000e0020'),
  'active',
  'the professional keeps working — their other role is still active');

select * from finish();
rollback;
