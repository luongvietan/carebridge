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

  -- 3) Restrict professionals missing any approved critical doc required for their role
  for rec in
    select p.id as professional_id, p.professional_status
      from professionals p
     where p.professional_status in ('active','pending_verification')
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
           professional_status = case when professional_status = 'active'
                                      then 'booking_restricted' else professional_status end,
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

-- Schedule the daily run. pg_cron is available on hosted Supabase; guard it so a local
-- stack without pg_cron preloaded does not break `supabase db reset`.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('compliance-sweep-daily', '0 2 * * *',
                        $cron$select public.fn_run_compliance_sweep()$cron$);
exception when others then
  raise notice 'pg_cron not available, skipping schedule: %', sqlerrm;
end;
$$;
