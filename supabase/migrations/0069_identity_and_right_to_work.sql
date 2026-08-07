-- Client request, 7 August 2026: spell out acceptable identity documents, take a
-- proof of address issued within the last three months, accept a CCPS for
-- nurses, and verify Right to Work with a Home Office share code where it
-- applies.

/* ------------------------------------------------------- document types --- */

-- Proof of address carries no expiry date: what matters is that it was ISSUED
-- recently, which is checked against issued_date at upload
-- (lib/onboarding/document-dates.ts). has_expiry stays false so migration 0041's
-- "expiry required" rule does not demand a meaningless date.
--
-- Neither type is compliance-critical yet. Making them critical would make every
-- professional already active non-compliant overnight and the nightly sweep
-- would restrict them all before anyone had the chance to upload. They appear in
-- the checklist and are reviewed; the client can promote them to blocking once
-- the existing professionals have supplied them.
insert into document_types (code, name, category, is_compliance_critical, has_expiry) values
  ('proof_of_address','Proof of Address','identity',    false, false),
  ('ccps','Certificate of Current Professional Status (CCPS)','registration', false, true)
on conflict (code) do nothing;

-- Proof of address is asked of everyone.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join document_types d on d.code = 'proof_of_address'
on conflict (professional_role_id, document_type_id) do nothing;

-- A CCPS evidences good standing from a regulator, typically for nurses who have
-- practised outside the UK; it supplements the NMC confirmation rather than
-- replacing it.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join document_types d on d.code = 'ccps'
 where r.code in ('adult_nurse','paediatric_nurse','mental_health_nurse')
on conflict (professional_role_id, document_type_id) do nothing;

/* -------------------------------------------------------- right to work --- */

-- British and Irish citizens prove the right to work with a passport; everyone
-- else uses a Home Office share code, which an administrator redeems on
-- gov.uk/view-right-to-work. Recording WHICH basis applies is what makes it
-- possible to demand the code only where it is actually required.
alter table professionals
  add column if not exists right_to_work_basis text,
  add column if not exists right_to_work_share_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'professionals_right_to_work_basis_check'
  ) then
    alter table professionals
      add constraint professionals_right_to_work_basis_check
      check (right_to_work_basis is null or right_to_work_basis in ('uk_irish_citizen','share_code'));
  end if;
end $$;

-- A share code is meaningless without the basis that calls for it.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'professionals_share_code_requires_basis_check'
  ) then
    alter table professionals
      add constraint professionals_share_code_requires_basis_check
      check (
        right_to_work_share_code is null
        or right_to_work_basis = 'share_code'
      );
  end if;
end $$;

comment on column professionals.right_to_work_basis is
  'How the right to work is evidenced: uk_irish_citizen (passport) or share_code (Home Office online check).';
comment on column professionals.right_to_work_share_code is
  'Home Office share code, 9 characters. Redeemed by an administrator at gov.uk/view-right-to-work before approval.';
