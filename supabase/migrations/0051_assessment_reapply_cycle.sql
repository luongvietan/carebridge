-- Spec §2: "Applicants who fail all 3 attempts ... wait a period of time before
-- reapplying again. This could be 3 to 6 months."
--
-- Previously `assessment_attempts` was uniquely keyed on
-- (professional_id, attempt_number) with attempt_number constrained to 1..3, so
-- a 4th attempt row was impossible. After three completed fails the applicant
-- was locked out *permanently* — there was no way to grant a fresh set of
-- attempts once the lock period elapsed.
--
-- Introduce an assessment "cycle": each reapplication is a new cycle of up to 3
-- attempts (numbered 1..3 again). Prior cycles are preserved for the admin
-- assessment record, satisfying the spec's "wait then reapply" requirement.
alter table assessment_attempts
  add column if not exists assessment_cycle smallint not null default 1;

alter table assessment_attempts
  drop constraint if exists assessment_attempts_professional_id_attempt_number_key;

alter table assessment_attempts
  add constraint assessment_attempts_prof_cycle_attempt_key
  unique (professional_id, assessment_cycle, attempt_number);
