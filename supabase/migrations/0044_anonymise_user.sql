-- GDPR right-to-erasure: admin-initiated ANONYMISATION (not hard delete).
--
-- A hard delete would cascade (users → professionals → documents → bookings …)
-- and destroy compliance and financial records the platform must retain. Instead
-- we redact personal data in place: scrub PII columns, drop personal preference
-- collections, deactivate the login, and keep the record skeleton + compliance
-- status + financial linkage intact. The caller (anonymiseUser server action)
-- additionally removes the user's uploaded files from storage and scrubs the
-- auth.users email/metadata, which this SQL function cannot reach.

create or replace function public.fn_anonymise_user(p_user_id uuid, p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Account: scrub the email and lock the account out of login.
  update users
     set email = 'anonymised+' || p_user_id || '@deleted.invalid',
         is_active = false,
         account_status = 'deactivated',
         updated_at = now()
   where id = p_user_id;

  -- Professional profile PII (retain compliance status + dates for the audit trail).
  update professionals
     set full_name = 'Anonymised professional',
         date_of_birth = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         national_insurance_no = null,
         professional_summary = null,
         profile_photo_path = null,
         professional_status = 'removed',
         updated_at = now()
   where user_id = p_user_id;

  -- Personal-preference child collections are pure PII — remove them.
  delete from professional_skills
   where professional_id in (select id from professionals where user_id = p_user_id);
  delete from professional_availability
   where professional_id in (select id from professionals where user_id = p_user_id);

  -- Document PII columns; verification_status / expiry_date / dates are kept so
  -- the compliance audit trail survives. storage_path is blanked because the
  -- caller deletes the underlying files from storage.
  update documents
     set original_filename = null, reference_number = null, issuing_body = null,
         storage_path = '', notes = null, updated_at = now()
   where professional_id in (select id from professionals where user_id = p_user_id);

  -- Private client PII (stripe_customer_id retained for financial records).
  update private_clients
     set full_name = 'Anonymised client', phone = null, email_contact = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         updated_at = now()
   where user_id = p_user_id;

  -- Organisation PII (stripe_customer_id retained for financial records).
  update organisations
     set organisation_name = 'Anonymised organisation', contact_person = null,
         phone = null, email_contact = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         cqc_registration_number = null, billing_email = null, billing_address = null,
         updated_at = now()
   where user_id = p_user_id;

  insert into audit_log (actor_user_id, actor_type, action, entity_type, entity_id, summary)
  values (p_admin_id, 'admin', 'user.anonymised', 'user', p_user_id::text,
          'Personal data anonymised on GDPR erasure request; compliance and financial records retained');
end;
$$;

revoke all on function public.fn_anonymise_user(uuid, uuid) from public, anon, authenticated;
