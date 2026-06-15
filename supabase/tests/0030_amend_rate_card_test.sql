begin;
select plan(3);

insert into professional_roles (id, code, name, is_active)
  values ('00000000-0000-0000-0000-0000000d0001','rn_rate','RN Rate', true) on conflict do nothing;
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, platform_fee_type, currency)
  values ('00000000-0000-0000-0000-0000000d0001', 40, 28, 'derived', 'GBP') on conflict do nothing;

select lives_ok($$ select amend_rate_card('00000000-0000-0000-0000-0000000d0001', 45, 30, 'derived', null, 'GBP', null) $$);

select is(
  (select count(*)::int from rate_cards where professional_role_id='00000000-0000-0000-0000-0000000d0001' and effective_to is null),
  1, 'exactly one active card after amend');

select throws_ok(
  $$ select amend_rate_card('00000000-0000-0000-0000-0000000d0001', 20, 30, 'derived', null, 'GBP', null) $$,
  '23514', null, 'margin constraint rejects charge below payout');

select * from finish();
rollback;
