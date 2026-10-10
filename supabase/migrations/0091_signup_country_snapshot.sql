-- Country is an account fact: auth user_metadata is editable after signup.
alter table public.users add column country_code text references public.countries(code);

-- Preserve historical professional/organisation country before considering old
-- signup metadata. Legacy accounts without either remain British deliberately.
update public.users u set country_code = coalesce(
  (select p.country_code from public.professionals p where p.user_id=u.id),
  (select o.country_code from public.organisations o where o.user_id=u.id),
  (select case when a.raw_user_meta_data->>'market' in ('PT','GB') then a.raw_user_meta_data->>'market' end from auth.users a where a.id=u.id),
  'GB'
);

create function public.snapshot_signup_country() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare signup_market text;
begin
  select a.raw_user_meta_data->>'market' into signup_market from auth.users a where a.id=new.id;
  new.country_code := case when signup_market in ('PT','GB') then signup_market else 'PT' end;
  return new;
end;
$$;
create trigger trg_users_signup_country before insert on public.users
for each row execute function public.snapshot_signup_country();

create function public.guard_account_country() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.country_code is distinct from old.country_code and auth.role() in ('anon','authenticated') then
    raise exception 'Account country cannot be changed.' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger trg_users_country_immutable before update of country_code on public.users
for each row execute function public.guard_account_country();
