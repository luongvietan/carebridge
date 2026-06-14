begin;
select plan(3);

select has_table('notification_templates');
select has_table('notifications');
select col_has_check('notification_templates','type');

select * from finish();
rollback;
