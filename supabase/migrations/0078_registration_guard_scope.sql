-- Narrow the activation guard introduced in 0076 back to what it replaced.
--
-- 0076 generalised the nanny-specific Ofsted check to every register, which
-- quietly added a NEW rule the UK never had: an Adult Nurse could no longer be
-- activated without a registration number stored on the professional. CI caught
-- it immediately, and it is the same mistake I declined to make with proof of
-- address — tightening a rule retroactively can lock out professionals who were
-- approved perfectly properly under the rule that existed at the time.
--
-- The guard now covers only the two registers where the reference IS the
-- registration and there is no separate document standing in for it:
--   * Ofsted   — the URN is the registration
--   * ISS      — the authorisation number is the authorisation
-- For the NMC, HCPC and the Ordens, activation is already gated twice over: the
-- registration document must be approved, and an administrator must have checked
-- the register and recorded it (0070). The number is required at the point the
-- professional fills the form (saveProfile), which is where a missing one can
-- actually be explained to the person who can fix it.

create or replace function enforce_registration_reference()
returns trigger
language plpgsql
as $$
declare
  register text;
  role_name text;
begin
  if new.professional_status <> 'active' then
    return new;
  end if;

  select r.registration_register, r.name into register, role_name
    from professional_roles r
   where r.id = new.professional_role_id;

  if register is null then
    return new;
  end if;

  if register = 'ofsted'
     and coalesce(btrim(new.ofsted_registration_number), '') = '' then
    raise exception 'An Ofsted registration number is required before a % can be activated', role_name;
  end if;

  if register = 'iss'
     and coalesce(btrim(new.iss_authorisation_number), '') = '' then
    raise exception 'An ISS authorisation number is required before a % can be activated', role_name;
  end if;

  return new;
end;
$$;
