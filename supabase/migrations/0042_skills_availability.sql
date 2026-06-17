-- Profile child collections: skills/specialities and weekly availability.
--
-- The schema for professional_skills and professional_availability has existed
-- since 0004, but (a) the `skills` reference table was never seeded and (b) the
-- two child tables only had the admin_all RLS policy from 0016 — a professional
-- could neither read nor write their own skills/availability. This migration
-- seeds a starter skill list and adds owner self-policies so the onboarding
-- profile form can manage them, matching the prof_docs_self pattern.

insert into skills (name) values
  ('Wound Care'),
  ('Medication Administration'),
  ('Catheter Care'),
  ('PEG / Enteral Feeding'),
  ('Dementia Care'),
  ('Palliative & End of Life Care'),
  ('Mental Health Support'),
  ('Learning Disabilities Support'),
  ('Autism Support'),
  ('Manual Handling'),
  ('Phlebotomy'),
  ('Tracheostomy Care'),
  ('Stoma Care'),
  ('Diabetes Management'),
  ('Tissue Viability'),
  ('Continence Care'),
  ('Epilepsy Awareness'),
  ('Paediatric Care'),
  ('Elderly Care'),
  ('Physiotherapy / Rehabilitation')
on conflict (name) do nothing;

-- Owner self-access for the two profile child collections.
drop policy if exists prof_skills_self on professional_skills;
create policy prof_skills_self on professional_skills
  for all
  using (professional_id in (select id from professionals where user_id = auth.uid()))
  with check (professional_id in (select id from professionals where user_id = auth.uid()));

drop policy if exists prof_availability_self on professional_availability;
create policy prof_availability_self on professional_availability
  for all
  using (professional_id in (select id from professionals where user_id = auth.uid()))
  with check (professional_id in (select id from professionals where user_id = auth.uid()));

create index if not exists idx_prof_availability_day on professional_availability(day_of_week);
create index if not exists idx_prof_skills_skill on professional_skills(skill_id);
