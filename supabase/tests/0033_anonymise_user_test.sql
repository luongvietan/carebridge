begin;
select plan(5);

select has_function('public', 'fn_anonymise_user', 'anonymise function exists');

-- auth.users inserts fire handle_new_user, which creates the public.users rows.
-- The on-conflict inserts make the test robust either way.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'victim@test.dev', '{"account_type":"professional"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000f2', 'adminactor@test.dev', '{"account_type":"admin"}'::jsonb);
insert into users (id, email, account_type) values
  ('00000000-0000-0000-0000-0000000000f1', 'victim@test.dev', 'professional'),
  ('00000000-0000-0000-0000-0000000000f2', 'adminactor@test.dev', 'admin')
  on conflict (id) do nothing;

insert into professional_roles (id, code, name)
  values ('00000000-0000-0000-0000-0000000000a9', 'rn_anon_test', 'RN (anon test)');
insert into professionals
    (id, user_id, full_name, professional_role_id, national_insurance_no, postcode, professional_status)
  values ('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-0000000000f1', 'Jane Doe',
          '00000000-0000-0000-0000-0000000000a9', 'QQ123456C', 'E1 6AN', 'active');
insert into skills (id, name) values ('00000000-0000-0000-0000-0000000000d9', 'Anon Test Skill');
insert into professional_skills (professional_id, skill_id)
  values ('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-0000000000d9');
insert into document_types (id, code, name, category, has_expiry)
  values ('00000000-0000-0000-0000-0000000000c9', 'anon_doc_test', 'Doc (anon test)', 'identity', false);
insert into documents (professional_id, document_type_id, storage_path, original_filename, reference_number)
  values ('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-0000000000c9',
          'b9/x.pdf', 'passport.pdf', 'REF123');

-- Mimic the service-role context the RPC runs under in production so the
-- professionals column guard (0032) permits the status change.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select fn_anonymise_user('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2');

select is(
  (select national_insurance_no from professionals where id = '00000000-0000-0000-0000-0000000000b9'),
  null, 'NI number scrubbed');
select is(
  (select professional_status from professionals where id = '00000000-0000-0000-0000-0000000000b9'),
  'removed'::professional_status, 'professional status set to removed');
select is(
  (select count(*)::int from professional_skills where professional_id = '00000000-0000-0000-0000-0000000000b9'),
  0, 'skills removed');
select is(
  (select original_filename from documents where professional_id = '00000000-0000-0000-0000-0000000000b9'),
  null, 'document filename scrubbed');

select * from finish();
rollback;
