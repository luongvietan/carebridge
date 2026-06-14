begin;
select plan(2);

-- An authenticated user (no admin rights) can read the seeded reference tables.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000ab","role":"authenticated"}', true);
select count(*)::int as roles from professional_roles \gset
select count(*)::int as dts   from document_types \gset
reset role;

select is( :roles, 4,  'authenticated reads professional_roles' );
select is( :dts,   10, 'authenticated reads document_types' );

select * from finish();
rollback;
