-- pgcrypto is already enabled (migration 0000). Encrypt bank details at rest; the key is
-- supplied per call from PAYOUT_ENC_KEY by the server action and never stored.
create or replace function public.set_payout_details(
  p_professional_id uuid, p_account_name text, p_sort_code text, p_account_number text, p_key text
) returns void language plpgsql security definer as $$
begin
  insert into professional_payout_details (professional_id, account_name, sort_code_enc, account_number_enc, account_number_last4)
  values (
    p_professional_id, p_account_name,
    pgp_sym_encrypt(p_sort_code, p_key),
    pgp_sym_encrypt(p_account_number, p_key),
    right(p_account_number, 4)
  )
  on conflict (professional_id) do update set
    account_name = excluded.account_name,
    sort_code_enc = excluded.sort_code_enc,
    account_number_enc = excluded.account_number_enc,
    account_number_last4 = excluded.account_number_last4,
    updated_at = now();
end; $$;

create or replace function public.get_payout_last4(p_professional_id uuid)
returns text language sql stable as $$
  select account_number_last4 from professional_payout_details where professional_id = p_professional_id;
$$;

revoke all on function public.set_payout_details(uuid, text, text, text, text) from public, anon, authenticated;
