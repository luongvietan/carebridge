-- Language is a user preference, never a market/regulatory dimension.
alter table users add column preferred_locale text not null default 'pt-PT'
  check (preferred_locale in ('pt-PT', 'en-GB'));

create or replace function public.fn_user_locale_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare pref text;
begin
  select raw_user_meta_data->>'preferred_locale' into pref from auth.users where id = new.id;
  new.preferred_locale := case when pref in ('pt-PT','en-GB') then pref else 'pt-PT' end;
  return new;
end;
$$;
create trigger trg_user_locale_on_insert before insert on users
  for each row execute function public.fn_user_locale_on_insert();

create or replace function public.fn_sync_user_locale()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data->>'preferred_locale' in ('pt-PT','en-GB') then
    update users set preferred_locale = new.raw_user_meta_data->>'preferred_locale' where id = new.id;
  end if;
  return new;
end;
$$;
create trigger trg_auth_locale_update after update of raw_user_meta_data on auth.users
  for each row execute function public.fn_sync_user_locale();
-- Existing explicit preferences survive; everyone else receives the PT default.
update users u set preferred_locale = a.raw_user_meta_data->>'preferred_locale'
  from auth.users a where a.id = u.id and a.raw_user_meta_data->>'preferred_locale' in ('pt-PT','en-GB');
revoke all on function public.fn_user_locale_on_insert() from public, anon, authenticated;
revoke all on function public.fn_sync_user_locale() from public, anon, authenticated;
