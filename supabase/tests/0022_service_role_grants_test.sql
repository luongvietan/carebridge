begin;
select plan(2);

select ok(has_table_privilege('service_role', 'public.eligibility_screenings', 'INSERT'),
          'service_role can insert eligibility_screenings');
select ok(has_table_privilege('service_role', 'public.assessment_attempts', 'INSERT'),
          'service_role can insert assessment_attempts');

select * from finish();
rollback;
