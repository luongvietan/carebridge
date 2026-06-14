begin;
select plan(4);

select has_function('public','fn_run_compliance_sweep','compliance sweep function exists');

-- Fixtures: a role requiring DBS, a professional currently active+approved with an expired DBS
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1','e1@test.dev');
insert into users (id, email, account_type) values ('00000000-0000-0000-0000-0000000000e1','e1@test.dev','professional');
insert into professional_roles (id, code, name)
  values ('00000000-0000-0000-0000-0000000000a1','rn_eng_test','Registered Nurse (engine test)');
insert into document_types (id, code, name, category, is_compliance_critical)
  values ('00000000-0000-0000-0000-0000000000f1','enhanced_dbs_eng_test','Enhanced DBS (engine test)','dbs', true);
insert into compliance_requirements (professional_role_id, document_type_id)
  values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000f1');
insert into professionals (id, user_id, full_name, professional_role_id, professional_status, compliance_status)
  values ('00000000-0000-0000-0000-000000000aa1','00000000-0000-0000-0000-0000000000e1','Pro E',
          '00000000-0000-0000-0000-0000000000a1','active','approved');
insert into documents (professional_id, document_type_id, storage_path, verification_status, expiry_date)
  values ('00000000-0000-0000-0000-000000000aa1','00000000-0000-0000-0000-0000000000f1',
          'x/dbs.pdf','approved', current_date - 1);

select fn_run_compliance_sweep();

select is( (select verification_status from documents
            where professional_id='00000000-0000-0000-0000-000000000aa1'),
           'expired'::document_status, 'expired approved doc is marked expired');
select is( (select can_accept_bookings from professionals where id='00000000-0000-0000-0000-000000000aa1'),
           false, 'professional with lapsed critical doc cannot accept bookings');
select isnt( (select count(*) from professional_status_actions
              where professional_id='00000000-0000-0000-0000-000000000aa1' and is_automatic), 0::bigint,
             'automatic status action recorded');

select * from finish();
rollback;
