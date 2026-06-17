-- Surface the remaining spec-required document upload slots in onboarding.
--
-- The onboarding documents page builds its upload slots from
-- compliance_requirements for the professional's role, but the 0006 seed only
-- marked 6 of the 10 document types as requirements. Qualifications, Professional
-- References and DBS Update Service details were therefore never presented as
-- upload slots. Add them for every role so they are collected.
--
-- (Bank details are deliberately excluded here — they are collected through the
-- encrypted payout-details form, not as a plaintext document upload.)
--
-- None of these three are is_compliance_critical, so they appear as upload slots
-- but do not gate activation (which still depends only on the critical docs).

insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
from professional_roles r
join document_types d on d.code in
  ('qualification', 'professional_reference', 'dbs_update_service')
on conflict (professional_role_id, document_type_id) do nothing;
