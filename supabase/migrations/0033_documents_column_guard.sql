-- Lock verifier-controlled columns on `documents` against self-approval.
-- Same root cause as 0032: the `prof_docs_self` RLS policy in 0016 allows a
-- professional to UPDATE their own document rows but does not constrain which
-- columns may change. A professional could set verification_status='approved',
-- verified_by=self, verified_at=now() from the browser via supabase-js, then
-- the compliance sweep in 0015 would treat their docs as approved and the
-- professional becomes bookable without any admin review.
--
-- The only legitimate writer to these columns is the admin reviewDocument flow
-- (apps/web/src/lib/admin/compliance-actions.ts), which uses the service role.

create or replace function public.guard_documents_locked_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
begin
  if caller_role = 'service_role' then
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

drop trigger if exists trg_documents_lock_cols on documents;
create trigger trg_documents_lock_cols
  before update on documents
  for each row execute function public.guard_documents_locked_columns();
