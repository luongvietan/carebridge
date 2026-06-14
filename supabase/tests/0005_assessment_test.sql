begin;
select plan(5);

select has_table('eligibility_screenings');
select has_table('assessment_question_bank');
select has_table('assessment_attempts');
select has_table('assessment_answers');
-- attempt_number must be constrained to 1..3
select col_has_check('assessment_attempts','attempt_number');

select * from finish();
rollback;
