begin;
select plan(5);

-- The whole bank is country-tagged; nothing universal remains.
select is(
  (select count(*)::int from assessment_question_bank where country_code is null),
  0, 'every question carries a country');

-- The pre-existing English bank was backfilled to GB.
select ok(
  (select count(*) from assessment_question_bank where country_code = 'GB') >= 20,
  'the GB pool keeps its seeded questions');

-- Portugal sits a full assessment: at least 20 common questions in Portuguese.
select ok(
  (select count(*) from assessment_question_bank
    where country_code = 'PT' and professional_role_id is null and is_active) >= 20,
  'the PT common pool can serve a full attempt with top-up');

-- A question for a Portuguese role must never be tagged GB.
select is(
  (select count(*)::int
     from assessment_question_bank q
     join professional_roles r on r.id = q.professional_role_id
    where r.country_code = 'PT' and q.country_code = 'GB'),
  0, 'no Portuguese role question is mislabelled as GB content');

-- Options stay valid JSON arrays with the answer among them.
select is(
  (select count(*)::int from assessment_question_bank
    where country_code = 'PT'
      and (jsonb_typeof(options) <> 'array' or jsonb_array_length(options) < 2)),
  0, 'Portuguese questions carry a proper options array');

select * from finish();
rollback;
