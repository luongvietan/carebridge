-- Risk and needs assessment, Version 1.0 (Ana, 14 October 2026).
--
-- Ana's own bilingual specification replaces the draft question set of 0093:
--   * respondents: the person, family/informal carer, legal representative,
--     social worker or healthcare professional, other;
--   * routing outcomes (G standard, P physiotherapy, A admin review, N nursing,
--     X possibly outside scope) and green/amber/red bands. For the pilot only
--     green publishes; amber and red wait for review. `risk_level` now holds
--     the band (older rows keep their earlier values);
--   * an admin review record: approve (optionally with a different permitted
--     professional category), request more information, or decline, with the
--     reason and control measures, two workers or competency/equipment needed,
--     and a reassessment date;
--   * a safety brief for the matched professional — only what they need to
--     accept and deliver the service safely. No safeguarding detail, scores
--     or flags. Professionals reach it only for bookings they can already see
--     (0046), and the app logs each view.

alter table booking_risk_assessments drop constraint if exists booking_risk_assessments_respondent_check;
alter table booking_risk_assessments add constraint booking_risk_assessments_respondent_check
  check (respondent in ('self','family','legal_representative','professional','social_worker','other'));

alter table booking_risk_assessments drop constraint if exists booking_risk_assessments_risk_level_check;
alter table booking_risk_assessments add constraint booking_risk_assessments_risk_level_check
  check (risk_level in ('green','amber','red','low','medium','high','unclear'));

alter table booking_risk_assessments drop constraint if exists booking_risk_assessments_review_decision_check;
alter table booking_risk_assessments add constraint booking_risk_assessments_review_decision_check
  check (review_decision in ('approved','declined','more_info_requested'));

alter table booking_risk_assessments
  add column if not exists outcome text check (outcome in ('G','P','A','N','X')),
  add column if not exists permitted_role_id uuid references professional_roles(id),
  add column if not exists requires_two_workers boolean not null default false,
  add column if not exists required_competency text,
  add column if not exists client_message text,
  add column if not exists reassess_on date;

comment on column booking_risk_assessments.risk_level is 'Band: green, amber or red (older rows: low/medium/high/unclear).';
comment on column booking_risk_assessments.review_reasons is 'Flags raised by the answers and the booked role (lib/risk-assessment).';
comment on column booking_risk_assessments.review_note is 'Admin reason and risk-control measures (internal).';

create table if not exists booking_safety_briefs (
  booking_id            uuid primary key references bookings(id) on delete cascade,
  items                 text[] not null default '{}',
  instructions          text,
  requires_two_workers  boolean not null default false,
  updated_at            timestamptz not null default now()
);

alter table booking_safety_briefs enable row level security;

drop policy if exists booking_safety_briefs_admin_all on booking_safety_briefs;
create policy booking_safety_briefs_admin_all on booking_safety_briefs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Whoever can see the booking under its own policies (requester, matching
-- professional for open work, assigned professional) can read its brief.
drop policy if exists booking_safety_briefs_booking_visible on booking_safety_briefs;
create policy booking_safety_briefs_booking_visible on booking_safety_briefs
  for select to authenticated using (booking_id in (select id from bookings));

grant all on booking_safety_briefs to service_role;

-- Alerts carry no health detail; the client hears when more information is needed.
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
    'booking_review_required','booking_review_more_info'));

update notification_templates
   set body = 'A private client''s booking request ({{booking_id}}) is waiting for review. Open Admin › Bookings › Requests awaiting review.'
 where type = 'booking_review_required' and locale = 'en-GB';
update notification_templates
   set body = 'Um pedido de marcação de um cliente particular ({{booking_id}}) aguarda análise. Abra Administração › Marcações › Pedidos a aguardar análise.'
 where type = 'booking_review_required' and locale = 'pt-PT';

update notification_templates
   set body = 'We need to review some of the information before publishing your request ({{booking_id}}). A CareBridge team member will contact you. If anyone is in immediate danger, call 112.'
 where type = 'booking_under_review' and locale = 'en-GB';
update notification_templates
   set body = 'Precisamos de analisar algumas informações antes de publicar o seu pedido ({{booking_id}}). Um elemento da equipa CareBridge entrará em contacto consigo. Em caso de perigo imediato, ligue 112.'
 where type = 'booking_under_review' and locale = 'pt-PT';

insert into notification_templates (type, locale, subject, body) values
  ('booking_review_more_info','en-GB',
   'We need more information about your booking request',
   'Before we can publish your booking request ({{booking_id}}) we need some more information. {{note}} Please reply through Messages on CareBridge Connect, or contact us.'),
  ('booking_review_more_info','pt-PT',
   'Precisamos de mais informações sobre o seu pedido',
   'Antes de publicarmos o seu pedido de marcação ({{booking_id}}) precisamos de mais informações. {{note}} Responda através das Mensagens na CareBridge Connect ou contacte-nos.')
on conflict (type, locale) do nothing;
