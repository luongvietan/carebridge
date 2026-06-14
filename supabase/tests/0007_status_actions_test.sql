begin;
select plan(3);

select has_table('professional_status_actions');
select col_has_check('professional_status_actions','action_type');
select col_has_check('professional_status_actions','reason_code');

select * from finish();
rollback;
