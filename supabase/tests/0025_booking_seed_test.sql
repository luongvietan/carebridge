begin;
select plan(2);
select ok(
  (select count(*) from notification_templates where type='booking_cancellation') = 1,
  'booking_cancellation template seeded');
select ok(
  (select count(*) from rate_cards where effective_to is null) >=
  (select count(*) from professional_roles where is_active),
  'an active rate card exists for each active role');
select * from finish();
rollback;
