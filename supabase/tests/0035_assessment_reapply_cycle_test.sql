begin;
select plan(2);

-- Fixtures: a role and a professional who has exhausted cycle 1 (3 failed attempts).
insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000c0001','rn_c','RN C', true) on conflict do nothing;

insert into auth.users (id, email)
  values ('00000000-0000-0000-0000-0000000c0010','cycle@test.dev') on conflict do nothing;

insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values ('00000000-0000-0000-0000-0000000c0020','00000000-0000-0000-0000-0000000c0010',
          'Cycle Pro','00000000-0000-0000-0000-0000000c0001','pending_verification','pending_review')
  on conflict do nothing;

insert into assessment_attempts (professional_id, assessment_cycle, attempt_number, served_question_ids, score, passed, completed_at)
  values
  ('00000000-0000-0000-0000-0000000c0020',1,1,'[]'::jsonb,40,false, now()),
  ('00000000-0000-0000-0000-0000000c0020',1,2,'[]'::jsonb,50,false, now()),
  ('00000000-0000-0000-0000-0000000c0020',1,3,'[]'::jsonb,60,false, now());

-- Reapply after the lock: a fresh cycle (cycle 2, attempt 1) must be insertable.
-- The old global unique on (professional_id, attempt_number) made this impossible,
-- which is what permanently locked out a 3x-failed applicant.
select lives_ok(
  $$ insert into assessment_attempts (professional_id, assessment_cycle, attempt_number, served_question_ids)
     values ('00000000-0000-0000-0000-0000000c0020',2,1,'[]'::jsonb) $$,
  'a new assessment cycle grants a fresh attempt after the lock period');

-- Uniqueness is still enforced within a cycle.
select throws_ok(
  $$ insert into assessment_attempts (professional_id, assessment_cycle, attempt_number, served_question_ids)
     values ('00000000-0000-0000-0000-0000000c0020',1,1,'[]'::jsonb) $$,
  '23505', null,
  'a duplicate (professional, cycle, attempt) is rejected');

select * from finish();
rollback;
