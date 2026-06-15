begin;
select plan(2);

insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000c0001','rn_pay','RN Pay', true) on conflict do nothing;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000c0010','pay@test.dev') on conflict do nothing;
insert into professionals (id, user_id, full_name, professional_role_id)
  values ('00000000-0000-0000-0000-0000000c0020','00000000-0000-0000-0000-0000000c0010','Pay Pro','00000000-0000-0000-0000-0000000c0001')
  on conflict do nothing;

select lives_ok($$ select set_payout_details('00000000-0000-0000-0000-0000000c0020','A Pro','12-34-56','12345678','test-key') $$);

select is(
  (select account_number_last4 from professional_payout_details where professional_id='00000000-0000-0000-0000-0000000c0020'),
  '5678', 'account_number_last4 is stored');

select * from finish();
rollback;
