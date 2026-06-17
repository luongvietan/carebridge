-- §16 data-export hardening (defense-in-depth).
--
-- The export endpoint (apps/web/src/app/api/export/[entity]) and the admin
-- finance/reports pages read these views ONLY via the service role. But by
-- Supabase default privileges, views created in `public` are also granted to
-- anon/authenticated and exposed through PostgREST. As ordinary (security
-- DEFINER) views they would run with the owner's rights and BYPASS base-table
-- RLS, letting any logged-in user read all exported data — client/professional
-- PII, payments, audit log, platform revenue — straight from /rest/v1/<view>,
-- regardless of the app-layer admin check.
--
-- Lock them down two ways:
--   1. security_invoker = true  → the view runs with the *caller's* privileges
--      and RLS, so a non-admin reading it sees only what their RLS allows.
--   2. revoke from anon/authenticated → the views are not reachable via the
--      public API at all.
-- The service role retains access (granted in 0021 + default privileges) and
-- bypasses RLS, so the export endpoint keeps returning every row.

do $$
declare v text;
begin
  foreach v in array array[
    'v_export_professionals', 'v_export_clients', 'v_export_organisations',
    'v_export_bookings', 'v_export_assessments', 'v_export_compliance',
    'v_export_payments', 'v_export_payouts', 'v_export_audit', 'v_platform_revenue'
  ] loop
    execute format('alter view public.%I set (security_invoker = true)', v);
    execute format('revoke all on public.%I from anon, authenticated', v);
  end loop;
end $$;
