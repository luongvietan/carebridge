begin;
select plan(4);

select has_table('rate_cards');

insert into professional_roles (id, code, name)
  values ('00000000-0000-0000-0000-0000000000a1','rn_rates_test','Registered Nurse (rates test)');

-- first active card OK
insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate)
  values ('00000000-0000-0000-0000-0000000000a1', 40, 28);
select pass('first active rate card inserted');

-- second active card for same role must violate the unique partial index
select throws_ok($$
  insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate)
  values ('00000000-0000-0000-0000-0000000000a1', 42, 30)
$$, '23505', null, 'second active card per role rejected');

-- payout greater than charge must violate the margin check
select throws_ok($$
  insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate, effective_from)
  values ('00000000-0000-0000-0000-0000000000a1', 20, 30, now() + interval '1 day')
$$, '23514', null, 'payout > charge rejected');

select * from finish();
rollback;
