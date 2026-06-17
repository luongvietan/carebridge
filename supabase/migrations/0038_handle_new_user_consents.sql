-- Record privacy + terms consent atomically with user creation. Previously the
-- Next signUp action inserted consent rows in a separate best-effort call that
-- was skipped when no user object was returned and whose error was ignored,
-- leaving a GDPR audit gap. Doing it in the same trigger that creates the user
-- guarantees the consent record exists whenever the account does.
--
-- Preserves the account_type hardening from migration 0031.
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
           (new.id, 'privacy_policy',  consent_ver);
  end if;

  return new;
end;
$$;
