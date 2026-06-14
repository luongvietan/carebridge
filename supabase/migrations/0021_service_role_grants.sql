-- Backend server actions write onboarding/admin tables via the service role, which
-- bypasses RLS but still needs table privileges. Hosted Supabase grants these to
-- service_role by default; the local CLI does not for migration-created tables.
-- Grant explicitly so behaviour matches between local and hosted.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
