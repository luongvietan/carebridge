begin;
select plan(6);

select has_table('users');
select col_is_pk('users', 'id');
select fk_ok('public','users','id','auth','users','id');
select col_type_is('users','account_type','account_type');
select has_table('consents');
select fk_ok('public','consents','user_id','public','users','id');

select * from finish();
rollback;
