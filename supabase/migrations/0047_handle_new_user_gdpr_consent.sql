-- Also record a gdpr_data_handling consent at signup. The privacy policy the
-- user accepts describes how their personal data is processed, so the single
-- acceptance records consent across all three categories the schema supports.
-- This closes the gap where gdpr_data_handling consent was never captured.
-- (Preserves the account_type hardening from 0031 and the consent capture from 0038.)

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  requested   text := new.raw_user_meta_data->>'account_type';
  resolved    account_type;
  consent_ver text := coalesce(nullif(new.raw_user_meta_data->>'consent_version',''), 'v1');
begin
  resolved := case
    when requested in ('professional','private_client','organisation') then requested::account_type
    else 'private_client'::account_type
  end;

  insert into public.users (id, email, account_type)
  values (new.id, new.email, resolved)
  on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data->>'accepted_terms','') = 'true' then
    insert into public.consents (user_id, consent_type, version)
    values (new.id, 'terms_conditions', consent_ver),
           (new.id, 'privacy_policy',  consent_ver),
           (new.id, 'gdpr_data_handling', consent_ver);
  end if;

  return new;
end;
$$;
