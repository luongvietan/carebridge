begin;
select plan(4);

select has_table('private_clients');
select fk_ok('public','private_clients','user_id','public','users','id');
select has_table('organisations');
select has_column('organisations','cqc_registration_number');

select * from finish();
rollback;
