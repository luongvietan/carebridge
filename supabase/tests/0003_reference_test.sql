begin;
select plan(6);

select has_table('professional_roles');
select has_table('skills');
select has_table('mandatory_training_types');
select has_table('document_types');
select col_has_default('document_types','is_compliance_critical');
select col_type_is('document_types','is_compliance_critical','boolean');

select * from finish();
rollback;
