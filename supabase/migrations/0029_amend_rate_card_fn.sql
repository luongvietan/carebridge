-- Atomically close the current active card and open a new one, preserving uq_rate_card_active.
create or replace function public.amend_rate_card(
  p_role_id uuid, p_charge numeric, p_payout numeric,
  p_fee_type text, p_fee_value numeric, p_currency text, p_admin_id uuid
) returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  update rate_cards set effective_to = now()
    where professional_role_id = p_role_id and effective_to is null;
  insert into rate_cards (professional_role_id, client_charge_rate, professional_payout_rate,
    platform_fee_type, platform_fee_value, currency, effective_from, created_by)
  values (p_role_id, p_charge, p_payout, p_fee_type, p_fee_value, p_currency, now(), p_admin_id)
  returning id into new_id;
  return new_id;
end; $$;

revoke all on function public.amend_rate_card(uuid,numeric,numeric,text,numeric,text,uuid) from public, anon, authenticated;
