create extension if not exists pgcrypto;

-- Generic updated_at maintenance trigger function, reused by every mutable table.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
