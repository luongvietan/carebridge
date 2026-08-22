-- Portugal Phase 2 — euro rate cards.
--
-- Phase 1 left the eight Portuguese roles unpriced on purpose: an unpriced role
-- cannot be booked, which was correct for a country that is not live, and it
-- kept euro amounts out of the sterling revenue figures until the currency work
-- existed. That work now does (per-currency finance totals, EUR in the admin
-- rate form, revenue tiles that never mix currencies).
--
-- These figures are working placeholders pending Ana's confirmed pricing for
-- the Portuguese market. Each is amendable in one click from /admin/rates like
-- any other card; nothing here decides what Portugal will finally charge.

insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate,
                        platform_fee_type, platform_fee_value, currency)
select r.id, v.charge, v.payout, 'derived', null::numeric, 'EUR'
  from (values
    ('pt_enfermeiro_adulto',       25.00, 18.00),
    ('pt_enfermeiro_pediatrico',   25.00, 18.00),
    ('pt_enfermeiro_saude_mental', 25.00, 18.00),
    ('pt_fisioterapeuta',          30.00, 21.00),
    ('pt_auxiliar_saude',          15.00, 11.00),
    ('pt_cuidador_infantil',       14.00, 10.50),
    ('pt_babysitter',              12.00,  9.00),
    ('pt_ama_autorizada',          15.00, 11.00)
  ) as v(code, charge, payout)
  join professional_roles r on r.code = v.code
 where not exists (
    select 1
      from rate_cards rc
     where rc.professional_role_id = r.id
       and rc.effective_to is null
);
