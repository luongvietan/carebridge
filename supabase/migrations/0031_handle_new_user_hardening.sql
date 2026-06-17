-- Reject privileged account_type values supplied via auth signup metadata.
-- Supabase's anon signup endpoint accepts arbitrary `options.data`, so the Next
-- zod allow-list in apps/web/src/lib/auth/actions.ts can be bypassed. Without
-- this trigger guard, an unauthenticated caller could provision themselves as
-- `account_type='admin'` by passing `options.data.account_type='admin'`.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data->>'account_type';
  resolved  account_type;
begin
  resolved := case
    when requested in ('professional','private_client','organisation') then requested::account_type
    else 'private_client'::account_type
  end;
  insert into public.users (id, email, account_type)
  values (new.id, new.email, resolved)
  on conflict (id) do nothing;
  return new;
end;
$$;
