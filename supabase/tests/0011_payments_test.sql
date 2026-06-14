begin;
select plan(4);

select has_table('payments');
select col_type_is('payments','status','payment_status');
select has_table('payouts');
select has_table('professional_payout_details');

select * from finish();
rollback;
