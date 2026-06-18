-- Spec §3 lists "Professional registration details" as a profile field — the
-- regulatory body and registration number (e.g. NMC / HCPC / GMC). The uploaded
-- registration certificate (§4) is the proof; these columns capture the details
-- so they are queryable, searchable and visible in the admin dashboard.
alter table professionals
  add column if not exists registration_body   text,
  add column if not exists registration_number text;
