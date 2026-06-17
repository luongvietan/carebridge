-- Require an expiry date on documents whose type carries one.
--
-- The daily compliance sweep (fn_run_compliance_sweep, 0015) only expires or
-- raises alerts on rows where `expiry_date is not null`. A DBS / registration /
-- insurance / training certificate uploaded WITHOUT an expiry date would
-- therefore stay 'approved' forever and never trigger a compliance alert — the
-- professional would keep accepting bookings on a lapsed certificate.
--
-- The application layer (apps/web/src/lib/onboarding/document-expiry.ts) already
-- validates this on the upload path, but uploadDocument writes via the service
-- role, so this trigger is the authoritative backstop for every writer.
--
-- Enforced on INSERT, and on UPDATE only when an existing expiry is being
-- cleared. UPDATEs that leave a legacy null untouched (e.g. an admin approving a
-- pre-existing row) are allowed so historical data does not block review.

create or replace function public.guard_documents_expiry_present()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  type_has_expiry boolean;
begin
  select has_expiry into type_has_expiry
    from document_types where id = new.document_type_id;

  -- Only enforce for types that carry an expiry, and only when none is set.
  if coalesce(type_has_expiry, false) and new.expiry_date is null then
    -- INSERT must supply an expiry; UPDATE must not clear an existing one.
    -- (OLD is referenced only on the UPDATE path so it is never touched on INSERT.)
    if tg_op = 'INSERT' then
      raise exception 'expiry_date is required for documents of this type'
        using errcode = '23514';
    elsif old.expiry_date is not null then
      raise exception 'expiry_date is required for documents of this type'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_documents_require_expiry on documents;
create trigger trg_documents_require_expiry
  before insert or update on documents
  for each row execute function public.guard_documents_expiry_present();
