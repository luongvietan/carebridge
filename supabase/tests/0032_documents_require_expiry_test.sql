begin;
select plan(4);

select has_function('public','guard_documents_expiry_present','expiry guard function exists');

-- Fixtures: one expiring document type, one non-expiring type, one professional.
insert into auth.users (id, email, raw_user_meta_data)
  values ('00000000-0000-0000-0000-0000000000d1','d1@test.dev','{"account_type":"professional"}'::jsonb);
insert into professional_roles (id, code, name)
  values ('00000000-0000-0000-0000-0000000000b1','rn_exp_test','Registered Nurse (expiry test)');
insert into document_types (id, code, name, category, is_compliance_critical, has_expiry) values
  ('00000000-0000-0000-0000-0000000000c1','dbs_exp_test','Enhanced DBS (expiry test)','dbs', true, true),
  ('00000000-0000-0000-0000-0000000000c2','ref_exp_test','Reference (no-expiry test)','reference', false, false);
insert into professionals (id, user_id, full_name, professional_role_id)
  values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000d1','Pro Exp',
          '00000000-0000-0000-0000-0000000000b1');

-- 1) An expiring type with no expiry_date is rejected.
select throws_ok(
  $$insert into documents (professional_id, document_type_id, storage_path)
    values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c1','x/dbs.pdf')$$,
  '23514',
  'expiry_date is required for documents of this type',
  'expiring document type requires an expiry_date');

-- 2) An expiring type WITH an expiry_date is accepted.
select lives_ok(
  $$insert into documents (professional_id, document_type_id, storage_path, expiry_date)
    values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c1','x/dbs2.pdf', current_date + 30)$$,
  'expiring document with an expiry_date is accepted');

-- 3) A non-expiring type is accepted without an expiry_date.
select lives_ok(
  $$insert into documents (professional_id, document_type_id, storage_path)
    values ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c2','x/ref.pdf')$$,
  'non-expiring document type is accepted without an expiry_date');

select * from finish();
rollback;
