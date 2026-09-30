-- Portugal — the onboarding requirements for independent professionals, as Ana
-- set them out on 30 September:
--
--   identification and right to work in Portugal; NIF and NISS; proof of
--   activity opened with Finanças as a self-employed professional; the
--   Portuguese criminal-record certificate (for childcare, the one that covers
--   regular contact with minors) and, when applicable, the certificate from
--   other countries lived in recently; qualifications and professional
--   registration; professional liability and workplace accident insurance;
--   references and employment history; bank details; expiry dates with
--   automatic suspension.
--
-- Training is not mandatory in Portugal as it is in the UK, so the training
-- certificate leaves the Portuguese requirements; the online competency
-- assessment (80% pass mark) is unchanged.
--
-- Portuguese roles used a few documents shared with the UK whose names are
-- English (Photo ID, Professional Indemnity Insurance, ...). The Portuguese
-- roles now have Portuguese documents of their own; the shared types are left
-- untouched for the UK.

/* --------------------------------------------------------------- NISS ---- */

alter table professionals add column if not exists niss text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'professionals_niss_check') then
    alter table professionals
      add constraint professionals_niss_check check (niss is null or niss ~ '^[0-9]{11}$');
  end if;
end $$;

comment on column professionals.niss is
  'Número de Identificação da Segurança Social (11 digits). Portuguese professionals only; personal data, cleared on anonymisation.';

-- Anonymisation must clear it too (GDPR erasure): the 0044 function, plus niss.
create or replace function public.fn_anonymise_user(p_user_id uuid, p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update users
     set email = 'anonymised+' || p_user_id || '@deleted.invalid',
         is_active = false,
         account_status = 'deactivated',
         updated_at = now()
   where id = p_user_id;

  update professionals
     set full_name = 'Anonymised professional',
         date_of_birth = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         national_insurance_no = null,
         niss = null,
         professional_summary = null,
         profile_photo_path = null,
         professional_status = 'removed',
         updated_at = now()
   where user_id = p_user_id;

  delete from professional_skills
   where professional_id in (select id from professionals where user_id = p_user_id);
  delete from professional_availability
   where professional_id in (select id from professionals where user_id = p_user_id);

  update documents
     set original_filename = null, reference_number = null, issuing_body = null,
         storage_path = '', notes = null, updated_at = now()
   where professional_id in (select id from professionals where user_id = p_user_id);

  update private_clients
     set full_name = 'Anonymised client', phone = null, email_contact = null,
         address_line1 = null, address_line2 = null, city = null, postcode = null,
         updated_at = now()
   where user_id = p_user_id;

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

/* ------------------------------------------------------ role wording ----- */

-- Ana's European-Portuguese wording: "Amas licenciadas", and home-support
-- professionals rather than "Auxiliar de Saúde".
update professional_roles set name = 'Ama Licenciada' where code = 'pt_ama_autorizada';
update professional_roles set name = 'Profissional de Apoio Domiciliário' where code = 'pt_auxiliar_saude';
update document_types set name = 'Licença/Autorização da Segurança Social (ISS) — Ama' where code = 'autorizacao_iss';

/* --------------------------------------------------- document types ------ */

insert into document_types (code, name, category, is_compliance_critical, has_expiry, country_code) values
  ('identificacao_direito_trabalho',
     'Documento de Identificação e Direito de Trabalho em Portugal (Cartão de Cidadão, passaporte ou título de residência)',
     'identity', true, true, 'PT'),
  ('niss_comprovativo', 'Comprovativo do NISS (Segurança Social)', 'identity', false, false, 'PT'),
  ('atividade_financas',
     'Comprovativo de Atividade Aberta nas Finanças (trabalhador independente)',
     'registration', true, false, 'PT'),
  ('registo_criminal_estrangeiro',
     'Certificado de Registo Criminal de Outros Países (se aplicável)',
     'dbs', false, true, 'PT'),
  ('qualificacoes_pt', 'Habilitações Académicas e Profissionais', 'registration', false, false, 'PT'),
  ('seguro_responsabilidade_civil', 'Seguro de Responsabilidade Civil Profissional', 'insurance', true, true, 'PT'),
  ('seguro_acidentes_trabalho', 'Seguro de Acidentes de Trabalho', 'insurance', true, true, 'PT'),
  ('referencias_pt', 'Referências Profissionais', 'reference', false, false, 'PT'),
  ('historico_profissional', 'Historial Profissional (CV)', 'reference', false, false, 'PT')
on conflict (code) do nothing;

update document_types set name = 'Comprovativo de NIF' where code = 'nif';

/* --------------------------------------------- Portuguese requirements --- */

-- Take the shared, English-named and now-superseded documents off the
-- Portuguese roles: training (not mandatory in Portugal), plus the ones the new
-- Portuguese documents replace.
delete from compliance_requirements
 where professional_role_id in (select id from professional_roles where country_code = 'PT')
   and document_type_id in (
     select id from document_types
      where code in ('photo_id','direito_residencia','comprovativo_morada',
                     'professional_indemnity_insurance','qualification',
                     'professional_reference','mandatory_training_certificate'));

-- Shared by every Portuguese role.
insert into compliance_requirements (professional_role_id, document_type_id, is_mandatory)
select r.id, d.id, true
  from professional_roles r
  join document_types d on d.code in
    ('identificacao_direito_trabalho','nif','niss_comprovativo','atividade_financas',
     'qualificacoes_pt','seguro_responsabilidade_civil','seguro_acidentes_trabalho',
     'referencias_pt','historico_profissional')
 where r.country_code = 'PT'
on conflict (professional_role_id, document_type_id) do nothing;

-- "When applicable": asked for, reviewed, but not a blocker (non-critical) and
-- flagged optional so the upload screen does not present it as owed by everyone.
insert into compliance_requirements (professional_role_id, document_type_id, is_mandatory)
select r.id, d.id, false
  from professional_roles r
  join document_types d on d.code = 'registo_criminal_estrangeiro'
 where r.country_code = 'PT'
on conflict (professional_role_id, document_type_id) do nothing;
