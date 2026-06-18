-- Audit v3 §4: re-uploading ("Replace") a renewed document used to INSERT a new
-- `documents` row while the prior expired/rejected row lingered forever, so the
-- admin review queue, the professional's document list, and the compliance
-- export accumulated stale duplicate rows per type.
--
-- Mark the previous, non-approved rows of the same (professional_id,
-- document_type_id) as superseded on re-upload (done in app code) and filter
-- superseded rows out of the compliance export view here.

alter table documents add column if not exists superseded_at timestamptz;

-- Recreate the compliance export view to exclude superseded rows. Re-apply the
-- 0049 lockdown (security_invoker + revoke from anon/authenticated) because
-- CREATE OR REPLACE resets view reloptions and the public grant would otherwise
-- expose PII through PostgREST.
create or replace view v_export_compliance as
select d.id, p.full_name, t.name as document_type, t.is_compliance_critical,
       d.verification_status, d.issued_date, d.expiry_date, d.reference_number, d.issuing_body
from documents d
join professionals p on p.id = d.professional_id
join document_types t on t.id = d.document_type_id
where d.superseded_at is null;

alter view public.v_export_compliance set (security_invoker = true);
revoke all on public.v_export_compliance from anon, authenticated;
