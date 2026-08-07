begin;
select plan(2);

-- What matters is that an authenticated non-admin sees the WHOLE reference
-- table, not a particular number of rows: the read policies must not filter
-- anything, or the role picker and the document checklist silently lose entries.
select count(*)::int as all_roles from professional_roles \gset
select count(*)::int as all_dts   from document_types \gset

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000ab","role":"authenticated"}', true);
select count(*)::int as roles from professional_roles \gset
select count(*)::int as dts   from document_types \gset
reset role;

select is( :roles, :all_roles, 'authenticated reads every professional role' );
select is( :dts,   :all_dts,   'authenticated reads every document type' );

select * from finish();
rollback;
