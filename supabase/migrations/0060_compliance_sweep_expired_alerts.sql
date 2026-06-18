-- Audit v4 §16: the sweep only ever raised 'expiring' alerts. Once a critical
-- document lapsed (step 1 flips it to 'expired') it no longer matched the
-- 'expiring' insert (which requires verification_status = 'approved'), so:
--   * no 'expired' alert was ever raised — the admin "Compliance alerts" list
--     kept showing a stale "expiring … due {past date}" and the page's
--     alert_type = 'expired' styling branch was dead code;
--   * the reminder emailer kept re-sending "due to expire on {past date}".
-- Fix: raise a de-duplicated 'expired' alert when a critical doc is expired, and
-- acknowledge the now-stale 'expiring' alert for the same document. Steps 1, 2
-- (expiring) and 3 (restrict ACTIVE) are otherwise unchanged from 0057.

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

  -- 2b) Raise a de-duplicated 'expired' alert for critical docs that have lapsed.
  insert into compliance_alerts (professional_id, document_id, alert_type, due_date)
  select d.professional_id, d.id, 'expired', d.expiry_date
    from documents d
    join document_types t on t.id = d.document_type_id
   where t.is_compliance_critical
     and d.verification_status = 'expired'
     and d.expiry_date is not null
     and not exists (
       select 1 from compliance_alerts a
        where a.document_id = d.id and a.alert_type = 'expired' and not a.acknowledged);

  -- 2c) Acknowledge the now-stale 'expiring' alert once the document has expired,
  --     so the admin list and reminders show the expiry rather than a past "due" date.
  update compliance_alerts a
     set acknowledged = true
    from documents d
   where a.document_id = d.id
     and a.alert_type = 'expiring'
     and not a.acknowledged
     and d.verification_status = 'expired';

  -- 3) Restrict ACTIVE professionals missing any approved critical doc for their
  --    role. Limited to 'active' so onboarding applicants are not mislabelled and
  --    an already-restricted professional is not re-flagged every night.
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
