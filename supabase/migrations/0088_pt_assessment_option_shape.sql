-- The Portuguese assessment showed blank answers and could not be passed.
--
-- 0082 seeded the twenty Portuguese questions with `options` as a plain array
-- of strings and `correct_option` as the full answer text. Every other row, and
-- the app (AssessmentOption = { key, text }), uses an array of { key, text }
-- objects with `correct_option` holding the key. A Portuguese applicant was
-- therefore shown four radio buttons with no labels, and no answer could ever
-- match the stored correct option.
--
-- Rewrite those rows into the shared shape: keys a, b, c, d in the original
-- order, and the correct option as the key of the answer it named. Rows already
-- in the object shape are untouched, so this is safe to run more than once.

update assessment_question_bank q
set
  options = (
    select jsonb_agg(jsonb_build_object('key', chr(96 + t.ord::int), 'text', t.val) order by t.ord)
    from jsonb_array_elements_text(q.options) with ordinality as t(val, ord)
  ),
  correct_option = (
    select chr(96 + t.ord::int)
    from jsonb_array_elements_text(q.options) with ordinality as t(val, ord)
    where t.val = q.correct_option
  )
where jsonb_typeof(q.options -> 0) = 'string'
  and exists (
    select 1 from jsonb_array_elements_text(q.options) as o(val) where o.val = q.correct_option
  );
