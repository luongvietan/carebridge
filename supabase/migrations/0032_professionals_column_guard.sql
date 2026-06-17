-- Lock verifier-controlled columns on `professionals` against client tampering.
-- The `prof_self` RLS policy in 0016 allows a user to update their own row, but
-- WITH CHECK only verifies row ownership — not which columns change. Combined
-- with the table grant `update ... to authenticated`, a professional could flip
-- their own `professional_status='active'` and `compliance_status='approved'`
-- from the browser via supabase-js, which makes `can_accept_bookings` true and
-- lets them be assigned bookings without DBS / training / insurance review.
--
-- We can't gate columns directly in RLS, so we install a BEFORE UPDATE trigger
-- that rejects writes to admin-controlled columns unless the caller is an
-- admin/founder or the service role. Admin server actions use the service role
-- (createServiceClient) and the compliance cron likewise, so this is fully
-- compatible with the existing write paths.

create or replace function public.guard_professionals_locked_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
begin
  -- service_role bypasses RLS entirely; allow all writes.
  if caller_role = 'service_role' then
    return new;
  end if;
  -- admin / founder may also write locked columns through server-side flows.
  if public.is_admin() then
    return new;
  end if;

  if new.professional_status     is distinct from old.professional_status     then
    raise exception 'professional_status is admin-controlled' using errcode = '42501';
  end if;
  if new.compliance_status       is distinct from old.compliance_status       then
    raise exception 'compliance_status is admin-controlled'   using errcode = '42501';
  end if;
  if new.assessment_locked_until is distinct from old.assessment_locked_until then
    raise exception 'assessment_locked_until is admin-controlled' using errcode = '42501';
  end if;
  if new.professional_role_id    is distinct from old.professional_role_id    then
    -- Role can be chosen at first save (was NULL); after it's set, only admin may change it.
    if old.professional_role_id is not null then
      raise exception 'professional_role_id can only be changed by an admin' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prof_lock_cols on professionals;
create trigger trg_prof_lock_cols
  before update on professionals
  for each row execute function public.guard_professionals_locked_columns();
