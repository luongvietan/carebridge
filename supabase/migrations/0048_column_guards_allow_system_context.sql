-- The column guards from 0032 (professionals) and 0033 (documents) block writes
-- to admin-controlled columns unless the caller is the service role or an admin.
-- They ALSO blocked trusted, non-API contexts that have no request.jwt.claims at
-- all: pg_cron (the daily fn_run_compliance_sweep), migrations, and direct DB
-- sessions. As a result the compliance sweep could neither mark documents
-- 'expired' nor flip a lapsed professional to 'booking_restricted' in production
-- — the guard raised '...is admin-controlled' and aborted the sweep.
--
-- PostgREST always sets request.jwt.claims for the API roles (authenticated,
-- anon, service_role), so a NULL claim means a direct/system connection, which
-- already has full database access and is inherently trusted. Allow those, while
-- continuing to block authenticated/anon API writes to these columns.

create or replace function public.guard_professionals_locked_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
begin
  -- No API request context (cron / migration / direct psql) or the service role.
  if caller_role is null or caller_role = 'service_role' then
    return new;
  end if;
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
    if old.professional_role_id is not null then
      raise exception 'professional_role_id can only be changed by an admin' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_documents_locked_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
begin
  if caller_role is null or caller_role = 'service_role' then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status then
    raise exception 'verification_status is admin-controlled' using errcode = '42501';
  end if;
  if new.verified_by         is distinct from old.verified_by         then
    raise exception 'verified_by is admin-controlled'         using errcode = '42501';
  end if;
  if new.verified_at         is distinct from old.verified_at         then
    raise exception 'verified_at is admin-controlled'         using errcode = '42501';
  end if;
  if new.rejection_reason    is distinct from old.rejection_reason    then
    raise exception 'rejection_reason is admin-controlled'    using errcode = '42501';
  end if;
  return new;
end;
$$;
