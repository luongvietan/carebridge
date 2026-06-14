-- Lookup/reference tables must be readable by any authenticated user — the onboarding
-- wizard lists roles, the document types required for a role, and training types.
-- Writes remain admin-only (the admin_all policies from 0016 still apply).
create policy ref_read_roles        on professional_roles        for select to authenticated using (true);
create policy ref_read_skills       on skills                    for select to authenticated using (true);
create policy ref_read_training     on mandatory_training_types  for select to authenticated using (true);
create policy ref_read_doctypes     on document_types            for select to authenticated using (true);
create policy ref_read_requirements on compliance_requirements   for select to authenticated using (true);
