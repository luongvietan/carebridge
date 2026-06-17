begin;
select plan(5);

-- Export/revenue views must run with security_invoker so they respect the
-- caller's RLS rather than the (privileged) view owner's.
select is(
  (select reloptions from pg_class where relname = 'v_export_clients')::text,
  '{security_invoker=true}',
  'v_export_clients runs with security_invoker'
);
select is(
  (select reloptions from pg_class where relname = 'v_platform_revenue')::text,
  '{security_invoker=true}',
  'v_platform_revenue runs with security_invoker'
);

-- The public API roles must NOT be able to read the export views directly.
set local role authenticated;
select throws_ok(
  'select * from public.v_export_clients',
  '42501',
  null,
  'authenticated cannot read v_export_clients via the API'
);
select throws_ok(
  'select * from public.v_platform_revenue',
  '42501',
  null,
  'authenticated cannot read v_platform_revenue via the API'
);
reset role;

-- The service role (used by the export endpoint) keeps full read access.
set local role service_role;
select lives_ok(
  'select * from public.v_export_clients limit 1',
  'service_role can still read v_export_clients'
);
reset role;

select * from finish();
rollback;
