-- Risk and needs assessment — governance decisions (Ana, 15 October 2026).
--
-- 1. Clinical review. Admins review general and non-clinical cases. Nursing
--    (outcome N) and red-risk requests stay on hold until a clinical reviewer
--    decides them. Clinical reviewers are individual accounts flagged here;
--    the app checks the flag (lib/risk-assessment/actions.ts) and the audit
--    log records every decision and every view under the reviewer's own id.
--    No account is flagged by this migration: grant it to the named person.
--
-- 2. Retention.
--    * Incomplete or abandoned assessments are deleted 30 days later. The
--      browser never stores an unfinished form, so "abandoned" here means a
--      request that was never served: cancelled or declined, or never staffed
--      (still held for review or open) 30 days after its scheduled end.
--    * Assessments of served bookings are kept for three years after the
--      final service, then deleted.
--    * Nothing is deleted while the booking or its client has an open or
--      investigating complaint, incident or safeguarding concern (incidents,
--      0073), or while `retention_hold` is set (e.g. a legal claim).
--    The professional's safety brief follows the same rules. A daily pg_cron
--    job runs the purge and writes the counts to the audit log.

alter table users add column if not exists is_clinical_reviewer boolean not null default false;
comment on column users.is_clinical_reviewer is
  'May decide nursing and red-risk assessment reviews (Ana, 15 Oct 2026). Grant to named individual accounts only.';

alter table booking_risk_assessments
  add column if not exists retention_hold boolean not null default false,
  add column if not exists retention_hold_reason text;
comment on column booking_risk_assessments.retention_hold is
  'Keep beyond the normal retention period, e.g. while a legal claim is active.';

create or replace function public.fn_purge_risk_assessments()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_abandoned integer;
  v_expired integer;
begin
  create temporary table if not exists purge_targets (booking_id uuid primary key, reason text) on commit drop;
  truncate purge_targets;

  insert into purge_targets (booking_id, reason)
  select b.id,
         case when b.status in ('cancelled', 'pending_review', 'open') then 'abandoned' else 'expired' end
    from bookings b
   where (
           -- never served: cancelled 30+ days ago, or never staffed 30+ days after its end
           (b.status = 'cancelled' and b.updated_at < now() - interval '30 days')
        or (b.status in ('pending_review', 'open') and b.scheduled_end < now() - interval '30 days')
           -- served: three years after the final service
        or (b.status not in ('cancelled', 'pending_review', 'open') and b.scheduled_end < now() - interval '3 years')
         )
     and (exists (select 1 from booking_risk_assessments ra where ra.booking_id = b.id)
          or exists (select 1 from booking_safety_briefs sb where sb.booking_id = b.id))
     and not exists (
           select 1 from booking_risk_assessments ra where ra.booking_id = b.id and ra.retention_hold)
     and not exists (
           select 1 from incidents i
            where i.status in ('open', 'investigating')
              and (i.booking_id = b.id or (b.private_client_id is not null and i.private_client_id = b.private_client_id)));

  delete from booking_safety_briefs sb using purge_targets t where sb.booking_id = t.booking_id;
  delete from booking_risk_assessments ra using purge_targets t where ra.booking_id = t.booking_id;

  select count(*) filter (where reason = 'abandoned'), count(*) filter (where reason = 'expired')
    into v_abandoned, v_expired
    from purge_targets;

  if v_abandoned + v_expired > 0 then
    insert into audit_log (actor_type, action, entity_type, entity_id, summary)
    values ('system', 'risk_assessment.purged', 'booking_risk_assessment', 'retention',
            format('Deleted %s abandoned and %s expired assessments under the retention rules.', v_abandoned, v_expired));
  end if;
  return jsonb_build_object('abandoned', v_abandoned, 'expired', v_expired);
end;
$$;

revoke all on function public.fn_purge_risk_assessments() from public, anon, authenticated;
grant execute on function public.fn_purge_risk_assessments() to service_role;

do $$
begin
  perform cron.schedule('risk-assessment-retention-daily', '30 3 * * *',
                        $cron$select public.fn_purge_risk_assessments()$cron$);
exception when others then
  raise notice 'pg_cron not available, skipping schedule: %', sqlerrm;
end;
$$;
