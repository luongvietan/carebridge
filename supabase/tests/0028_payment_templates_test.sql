begin;
select plan(3);
select is((select count(*) from notification_templates where type='payment_receipt')::int, 1, 'payment_receipt template seeded');
select is((select count(*) from notification_templates where type='payout_recorded')::int, 1, 'payout_recorded template seeded');
select isnt((select count(*) from pg_indexes where schemaname='public' and indexname='idx_payments_intent')::int, 0, 'payments intent unique index exists');
select * from finish();
rollback;
