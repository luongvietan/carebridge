begin;
select plan(3);

select has_extension('pgcrypto');
select has_function('public', 'set_updated_at', 'updated_at trigger helper exists');
-- pgtap must be available for tests to run at all
select has_extension('pgtap');

select * from finish();
rollback;
