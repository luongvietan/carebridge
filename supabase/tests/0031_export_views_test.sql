begin;
select plan(8);

select has_view('v_export_clients');
select has_view('v_export_organisations');
select has_view('v_export_assessments');
select has_view('v_export_payouts');

select has_column('v_export_clients', 'email_contact');
select has_column('v_export_organisations', 'cqc_registration_number');
select has_column('v_export_assessments', 'passed');
select has_column('v_export_payouts', 'amount');

select * from finish();
rollback;
