-- Audit v3 §4: the nightly compliance sweep restricted any professional in
-- ('active','pending_verification') missing an approved critical document. That
-- had two defects:
--   1. Brand-new applicants mid-onboarding (pending_verification, no docs yet)
--      were flipped to compliance_status='compliance_expired' — they should stay
--      'pending_review' until they've actually been approved once.
--   2. Because the status CASE only moves 'active' → 'booking_restricted', a
--      pending_verification applicant stayed pending_verification and therefore
--      MATCHED THE SWEEP AGAIN every night, re-inserting a duplicate
--      'booking_restriction' status-action row + audit_log row on every run
--      (unbounded growth for every applicant still in onboarding).
--
-- Fix: only auto-restrict professionals who were actually activated
-- (professional_status = 'active'). Once restricted they are no longer 'active',
-- so the action is recorded exactly once. Steps 1 (expire) and 2 (expiring
-- alerts) are unchanged.

create or replace function public.fn_run_compliance_sweep() returns void
language plpgsql as $$
declare
  rec record;
begin
  -- 1) Expire approved documents past their expiry date
  update documents
     set verification_status = 'expired', updated_at = now()
   where verification_status = 'approved'
     and expiry_date is not null and expiry_date < current_date;

  -- 2) Raise 'expiring' alerts for critical docs within 30 days (de-duplicated)
  insert into compliance_alerts (professional_id, document_id, alert_type, due_date)
  select d.professional_id, d.id, 'expiring', d.expiry_date
    from documents d
    join document_types t on t.id = d.document_type_id
   where t.is_compliance_critical
     and d.verification_status = 'approved'
     and d.expiry_date between current_date and current_date + 30
     and not exists (
       select 1 from compliance_alerts a
        where a.document_id = d.id and a.alert_type = 'expiring' and not a.acknowledged);

  -- 3) Restrict ACTIVE professionals missing any approved critical doc for their
  --    role. Limited to 'active' so (a) onboarding applicants are not mislabelled
  --    'compliance_expired' and (b) an already-restricted professional is not
  --    re-flagged every night.
  for rec in
    select p.id as professional_id, p.professional_status
      from professionals p
     where p.professional_status = 'active'
       and exists (
         select 1
           from compliance_requirements cr
           join document_types t on t.id = cr.document_type_id and t.is_compliance_critical
          where cr.professional_role_id = p.professional_role_id
            and not exists (
              select 1 from documents d
               where d.professional_id = p.id
                 and d.document_type_id = cr.document_type_id
                 and d.verification_status = 'approved'))
  loop
    update professionals
       set compliance_status = 'compliance_expired',
           professional_status = 'booking_restricted',
           updated_at = now()
     where id = rec.professional_id;

    insert into professional_status_actions
      (professional_id, action_type, reason_code, reason_text, resulting_status, is_automatic)
    values
      (rec.professional_id, 'booking_restriction', 'missing_documents',
       'Automatic block: required critical compliance document missing or expired',
       'booking_restricted', true);

    insert into audit_log (actor_type, action, entity_type, entity_id, summary)
    values ('system','professional.auto_restricted','professional', rec.professional_id::text,
            'Compliance sweep restricted professional');
  end loop;
end;
$$;
