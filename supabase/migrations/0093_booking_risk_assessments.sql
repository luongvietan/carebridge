-- Risk and needs assessment for private-client booking requests.
--
-- The client, a family member or a social worker answers a short questionnaire
-- before the request is published. The app scores it (lib/risk-assessment):
-- it recommends a type of professional and, for high-risk or unclear answers,
-- or a role other than the recommended one, the booking is created in
-- `pending_review` until an admin approves or declines it. This is guidance
-- for safety, not a medical diagnosis. Emergency answers stop the form before
-- anything is stored, so no row exists for them.
--
-- Answers can describe health (special-category data, RGPD art. 9). Only the
-- requester and admins can read them; writes go through the service role.

create table if not exists booking_risk_assessments (
  id                        uuid primary key default gen_random_uuid(),
  booking_id                uuid not null unique references bookings(id) on delete cascade,
  questionnaire_version     text not null,
  respondent                text not null check (respondent in ('self','family','social_worker','other')),
  answers                   jsonb not null,
  score                     integer not null check (score >= 0),
  risk_level                text not null check (risk_level in ('low','medium','high','unclear')),
  recommended_role_family   text not null,
  chosen_role_family        text,
  requires_review           boolean not null,
  review_reasons            text[] not null default '{}',
  consent_at                timestamptz not null,
  created_by                uuid not null references users(id),
  created_at                timestamptz not null default now(),
  review_decision           text check (review_decision in ('approved','declined')),
  review_note               text,
  reviewed_by               uuid references users(id),
  reviewed_at               timestamptz
);

create index if not exists idx_booking_risk_assessments_review
  on booking_risk_assessments (requires_review, review_decision);

alter table booking_risk_assessments enable row level security;

drop policy if exists booking_risk_assessments_admin_all on booking_risk_assessments;
create policy booking_risk_assessments_admin_all on booking_risk_assessments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists booking_risk_assessments_requester_read on booking_risk_assessments;
create policy booking_risk_assessments_requester_read on booking_risk_assessments
  for select to authenticated using (
    booking_id in (select id from bookings where requester_user_id = auth.uid())
  );

grant all on booking_risk_assessments to service_role;

-- E-mails: the client hears that the request is under review and the outcome;
-- admins hear that a request is waiting for them.
alter table notification_templates drop constraint notification_templates_type_check;
alter table notification_templates add constraint notification_templates_type_check
  check (type in (
    'registration_confirmation','email_verification','assessment_result',
    'compliance_approval','compliance_expiry_reminder','booking_request',
    'booking_confirmation','booking_cancellation','payment_receipt','payout_recorded',
    'booking_available','compliance_rejected','further_info_required','password_reset',
    'professional_rejected','account_removed','professional_suspended',
    'timesheet_submitted','timesheet_confirmed','timesheet_disputed',
    'message_received',
    'booking_under_review','booking_review_approved','booking_review_declined',
    'booking_review_required'));

insert into notification_templates (type, locale, subject, body) values
  ('booking_under_review','en-GB',
   'Your booking request is being reviewed',
   'Thank you. Based on the risk and needs assessment, our team will review your request ({{booking_id}}) before it is published to professionals. We will e-mail you when it has been reviewed. If anyone is in immediate danger, call 999.'),
  ('booking_under_review','pt-PT',
   'O seu pedido de marcação está em análise',
   'Obrigado. Com base na avaliação de riscos e necessidades, a nossa equipa vai analisar o seu pedido ({{booking_id}}) antes de o publicar aos profissionais. Enviaremos um e-mail quando a análise estiver concluída. Em caso de perigo imediato, ligue 112.'),
  ('booking_review_approved','en-GB',
   'Your booking request has been approved',
   'Your booking request ({{booking_id}}) has been reviewed and is now open to suitable professionals. {{note}}'),
  ('booking_review_approved','pt-PT',
   'O seu pedido de marcação foi aprovado',
   'O seu pedido de marcação ({{booking_id}}) foi analisado e está agora disponível para profissionais adequados. {{note}}'),
  ('booking_review_declined','en-GB',
   'Your booking request could not be published',
   'After review, your booking request ({{booking_id}}) could not be published on CareBridge Connect. {{note}} Please contact us if you would like to discuss the support needed.'),
  ('booking_review_declined','pt-PT',
   'Não foi possível publicar o seu pedido de marcação',
   'Após análise, não foi possível publicar o seu pedido de marcação ({{booking_id}}) na CareBridge Connect. {{note}} Contacte-nos se quiser falar sobre o apoio necessário.'),
  ('booking_review_required','en-GB',
   'A booking request needs review',
   'A private client''s booking request ({{booking_id}}) was held for review: risk level {{risk_level}}. Open Admin › Bookings › Review to approve or decline it.'),
  ('booking_review_required','pt-PT',
   'Um pedido de marcação precisa de análise',
   'O pedido de marcação de um cliente particular ({{booking_id}}) ficou em análise: nível de risco {{risk_level}}. Abra Administração › Marcações › Análise para o aprovar ou recusar.')
on conflict (type, locale) do nothing;
