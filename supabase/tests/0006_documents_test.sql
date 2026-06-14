begin;
select plan(5);

select has_table('documents');
select col_type_is('documents','verification_status','document_status');
select has_table('compliance_requirements');
select has_table('compliance_alerts');
-- deferred FK from 0005 now wired up
select fk_ok('public','professional_training_records','certificate_doc_id','public','documents','id');

select * from finish();
rollback;
