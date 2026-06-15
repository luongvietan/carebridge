begin;
select plan(2);
select has_column('users', 'account_status');
select is(
  (select column_default from information_schema.columns where table_name='users' and column_name='account_status'),
  '''active''::account_status', 'account_status defaults to active');
select * from finish();
rollback;
