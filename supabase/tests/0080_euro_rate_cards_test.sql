begin;
select plan(6);

-- Every Portuguese role carries exactly one active card, priced in euro.
select is(
  (select count(*)::int
     from rate_cards rc
     join professional_roles r on r.id = rc.professional_role_id
    where r.country_code = 'PT' and rc.effective_to is null),
  8, 'one active card per Portuguese role');

select is(
  (select count(*)::int
     from rate_cards rc
     join professional_roles r on r.id = rc.professional_role_id
    where r.country_code = 'PT' and rc.currency <> 'EUR'),
  0, 'every Portuguese card is denominated in EUR');

select is(
  (select count(*)::int
     from rate_cards rc
     join professional_roles r on r.id = rc.professional_role_id
    where r.country_code = 'PT' and rc.client_charge_rate < rc.professional_payout_rate),
  0, 'margin constraint holds on every Portuguese card');

select is(
  (select count(*)::int
     from rate_cards rc
     join professional_roles r on r.id = rc.professional_role_id
    where r.country_code = 'PT' and rc.platform_fee_type <> 'derived'),
  0, 'Portuguese fees are derived, matching the UK seed convention');

-- The UK is untouched by this migration.
select is(
  (select count(*)::int
     from rate_cards rc
     join professional_roles r on r.id = rc.professional_role_id
    where r.country_code = 'GB' and rc.currency <> 'GBP'),
  0, 'no UK role was given a non-GBP card');

select is(
  (select count(*)::int
     from rate_cards rc
     join professional_roles r on r.id = rc.professional_role_id
    where r.code = 'pt_ama_autorizada' and rc.effective_to is null and rc.currency = 'EUR'),
  1, 'the Ama Autorizada is bookable the moment Portugal goes live');

select * from finish();
rollback;
