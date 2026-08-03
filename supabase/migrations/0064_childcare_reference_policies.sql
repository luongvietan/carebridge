-- Read policies for the childcare reference tables added in 0063.
--
-- 0063 granted SELECT on role_categories and care_types but added no policy,
-- on the assumption that these lookup tables carry no RLS — the same as
-- professional_roles and document_types appeared to. That was wrong: RLS is
-- enabled on every table in this project's public schema, so both tables were
-- readable only by the service role. The visible effect was the onboarding role
-- picker losing its category headings (the embedded role_categories join
-- resolved to null for the signed-in user) and the booking form never offering
-- a care type.
--
-- Mirror 0019_reference_read_policies.sql: readable by any authenticated user,
-- writes still admin/service-role only.

create policy ref_read_role_categories on role_categories
  for select to authenticated using (true);

create policy ref_read_care_types on care_types
  for select to authenticated using (true);

-- 0063 also granted SELECT to anon for a public roles listing that does not
-- exist — the marketing pages use static copy. Without a matching policy the
-- grant is inert, but revoke it so the intent is not misread later.
revoke select on role_categories, care_types from anon;
