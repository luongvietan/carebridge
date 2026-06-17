-- Record the per-item mandatory-training attestation captured during eligibility
-- screening (which of the 7 training types the applicant confirmed current),
-- alongside the derived overall training_current boolean. Stored as a JSON map
-- of stable training keys -> boolean so the audit trail shows exactly what was
-- attested, and new training types can be added without a schema change.
alter table eligibility_screenings add column training_attestations jsonb;
