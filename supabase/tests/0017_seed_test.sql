begin;
select plan(4);

select is( (select count(*)::int from professional_roles), 4, '4 professional roles seeded');
select is( (select count(*)::int from mandatory_training_types), 7, '7 mandatory training types seeded');
select is( (select count(*)::int from document_types where is_compliance_critical), 5,
           '5 critical document types seeded');
select is( (select count(*)::int from notification_templates), 14, '14 notification templates seeded');

select * from finish();
rollback;

