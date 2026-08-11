-- Portugal Phase 1 — the Portuguese regulatory layer (client structure, 10 Aug).
--
-- Roles, documents and verification pathways as Ana set them out. Nothing here
-- touches the UK: Portuguese roles carry Portuguese codes, and the documents
-- that only make sense in one country are scoped to it.
--
-- Two things are deliberately NOT here, because they are Phase 2 and the client
-- has been told so:
--   * Rate cards. Pricing in euro is Phase 2, and an unpriced role simply cannot
--     be booked — which is the correct behaviour for a country that is not live.
--     It also keeps euro amounts out of the sterling revenue figures until the
--     currency work is done.
--   * Assessment questions. The structure already supports a bank per role, and
--     the roles below are Portuguese roles, so the questions are content rather
--     than schema.

/* ------------------------------------------------------ document types ---- */

insert into document_types (code, name, category, is_compliance_critical, has_expiry, country_code) values
  ('registo_criminal','Certificado de Registo Criminal','dbs', true, true, 'PT'),
  -- Lei 113/2009: work involving minors requires the certificate issued for that
  -- purpose, which is a different certificate rather than the same one used
  -- differently. Childcare roles require this one and not the general version.
  ('registo_criminal_menores','Registo Criminal para Funções com Menores','dbs', true, true, 'PT'),
  ('cedula_profissional','Cédula Profissional','registration', true, true, 'PT'),
  ('autorizacao_iss','Autorização ISS (Ama)','registration', true, true, 'PT'),
  ('nif','Número de Identificação Fiscal (NIF)','identity', false, false, 'PT'),
  ('comprovativo_morada','Comprovativo de Morada','identity', false, false, 'PT'),
  ('direito_residencia','Autorização de Residência / Direito ao Trabalho','right_to_work', true, true, 'PT'),
  ('primeiros_socorros','Certificado de Primeiros Socorros','training', true, true, 'PT')
on conflict (code) do nothing;

/* ---------------------------------------------------------------- roles --- */

insert into professional_roles (code, name, category_id, country_code, registration_register)
select v.code, v.name,
       (select id from role_categories where code = v.category),
       'PT', v.register
  from (values
    ('pt_enfermeiro_adulto',      'Enfermeiro/a — Adultos',                    'healthcare', 'ordem_enfermeiros'),
    ('pt_enfermeiro_pediatrico',  'Enfermeiro/a — Pediatria',                  'healthcare', 'ordem_enfermeiros'),
    ('pt_enfermeiro_saude_mental','Enfermeiro/a — Saúde Mental',               'healthcare', 'ordem_enfermeiros'),
    ('pt_fisioterapeuta',         'Fisioterapeuta',                            'healthcare', 'ordem_fisioterapeutas'),
    ('pt_auxiliar_saude',         'Auxiliar de Saúde / Apoio Domiciliário',    'healthcare', null),
    ('pt_cuidador_infantil',      'Cuidador(a) Infantil ao Domicílio',         'childcare',  null),
    ('pt_babysitter',             'Babysitter',                                'childcare',  null),
    -- The only role presented as an Ama, and the only one that can hold the
    -- authorisation. A Cuidador(a) Infantil cannot be approved into this role
    -- without it: the guard in 0076 refuses to activate an 'iss' role with no
    -- authorisation number on file.
    ('pt_ama_autorizada',         'Ama Autorizada',                            'childcare',  'iss')
  ) as v(code, name, category, register)
on conflict (code) do nothing;

/* ------------------------------------------------- compliance requirements */

-- Shared across every Portuguese role: identity, tax number, address, right to
-- reside and work, qualifications, references, insurance and training.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join document_types d on d.code in
    ('photo_id','nif','comprovativo_morada','direito_residencia',
     'qualification','professional_reference','professional_indemnity_insurance',
     'mandatory_training_certificate')
 where r.country_code = 'PT'
on conflict (professional_role_id, document_type_id) do nothing;

-- Healthcare: the general criminal record certificate.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join role_categories c on c.id = r.category_id and c.code = 'healthcare'
  join document_types d on d.code = 'registo_criminal'
 where r.country_code = 'PT'
on conflict (professional_role_id, document_type_id) do nothing;

-- Childcare: the certificate issued for work with minors, plus first aid.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join role_categories c on c.id = r.category_id and c.code = 'childcare'
  join document_types d on d.code in ('registo_criminal_menores','primeiros_socorros')
 where r.country_code = 'PT'
on conflict (professional_role_id, document_type_id) do nothing;

-- Cédula profissional for the roles that answer to an Ordem.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join document_types d on d.code = 'cedula_profissional'
 where r.country_code = 'PT'
   and r.registration_register in ('ordem_enfermeiros','ordem_fisioterapeutas')
on conflict (professional_role_id, document_type_id) do nothing;

-- The ISS authorisation itself, for the Ama.
insert into compliance_requirements (professional_role_id, document_type_id)
select r.id, d.id
  from professional_roles r
  join document_types d on d.code = 'autorizacao_iss'
 where r.code = 'pt_ama_autorizada'
on conflict (professional_role_id, document_type_id) do nothing;
