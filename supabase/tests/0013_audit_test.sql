begin;
select plan(4);

select has_table('audit_log');

insert into audit_log (action, entity_type, entity_id, summary)
  values ('document.approved','document','doc-1','approved');
select is( (select count(*)::int from audit_log), 1, 'insert works');

-- UPDATE is suppressed by rule => row keeps original summary
update audit_log set summary = 'tampered';
select is( (select summary from audit_log limit 1), 'approved', 'update is a no-op (append-only)');

-- DELETE is suppressed by rule => row still present
delete from audit_log;
select is( (select count(*)::int from audit_log), 1, 'delete is a no-op (append-only)');

select * from finish();
rollback;
