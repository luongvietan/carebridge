begin;
select plan(5);

-- Every English template has a Portuguese twin, so a Portuguese professional
-- never falls back to English mail for any type the platform sends.
select is(
  (select count(*)::int from notification_templates where locale = 'en-GB'),
  (select count(*)::int from notification_templates where locale = 'pt-PT'),
  'every template type has both an en-GB and a pt-PT variant');

select is(
  (select count(*)::int from notification_templates),
  (select count(distinct type)::int from notification_templates) * 2,
  'no stray third-locale rows and no missing halves');

-- (type, locale) is the identity now.
select throws_ok(
  $$ insert into notification_templates (type, locale, subject, body)
     values ('booking_confirmation','pt-PT','x','y') $$,
  '23505', null, 'duplicate type+locale is rejected');

-- The legacy single-column uniqueness is gone: a second locale of the same
-- type is exactly what this migration exists to allow.
select lives_ok(
  $$ insert into notification_templates (type, locale, subject, body)
     values ('booking_confirmation','xx-XX','x','y') $$,
  'a new locale of an existing type inserts cleanly');
delete from notification_templates where locale = 'xx-XX';

-- Placeholders survive translation untouched.
select is(
  (select count(*)::int from notification_templates
    where locale = 'pt-PT' and body like '%{{reason}}%' and type in
      ('compliance_rejected','further_info_required','professional_rejected',
       'account_removed','professional_suspended','timesheet_disputed')),
  6, 'Portuguese bodies keep their {{placeholders}}');

select * from finish();
rollback;
