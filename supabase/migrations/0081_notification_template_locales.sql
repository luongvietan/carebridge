-- Portugal Phase 2 — notification templates become per-locale.
--
-- Until now a template was one row per type, and every email went out in
-- English whatever the recipient's market. Templates gain a locale dimension:
-- (type, locale) is unique, 'en-GB' rows are the existing ones backfilled by
-- the default, and Portuguese variants arrive as data below. The sender picks
-- the recipient's locale from their professional record's country and falls
-- back to English wherever a variant does not exist yet, so nothing breaks
-- while translations land template by template.

alter table notification_templates add column if not exists locale text not null default 'en-GB';

-- 0012 made type alone unique; identity is (type, locale) from here on.
alter table notification_templates drop constraint if exists notification_templates_type_key;
alter table notification_templates drop constraint if exists notification_templates_type_locale_key;
alter table notification_templates
  add constraint notification_templates_type_locale_key unique (type, locale);

insert into notification_templates (type, locale, subject, body) values
  ('registration_confirmation','pt-PT',
   'Bem-vindo à CareBridge Connect',
   'A sua inscrição foi recebida.'),
  ('email_verification','pt-PT',
   'Confirme o seu e-mail',
   'É favor confirmar o seu endereço de e-mail.'),
  ('assessment_result','pt-PT',
   'O resultado da sua avaliação',
   'A sua avaliação de competências foi pontuada: {{score}}%. Resultado: {{passed}}. Inicie sessão para ver o resultado completo e os próximos passos.'),
  ('compliance_approval','pt-PT',
   'Conformidade aprovada',
   'Os seus documentos de conformidade foram aprovados.'),
  ('compliance_expiry_reminder','pt-PT',
   'Documento prestes a expirar',
   'Um documento de conformidade expira em {{due_date}}. Inicie sessão e carregue um certificado atualizado antes de expirar, caso contrário a sua capacidade de aceitar marcações será restringida.'),
  ('booking_request','pt-PT',
   'Pedido de marcação recebido',
   'O seu pedido de marcação ({{booking_id}}) foi submetido.'),
  ('booking_confirmation','pt-PT',
   'Marcação confirmada',
   'A sua marcação foi confirmada.'),
  ('booking_cancellation','pt-PT',
   'Marcação cancelada',
   'Uma marcação ({{booking_id}}) foi cancelada.'),
  ('password_reset','pt-PT',
   'Reponha a sua palavra-passe',
   'Utilize a ligação para repor a sua palavra-passe.'),
  ('payment_receipt','pt-PT',
   'Pagamento recebido',
   'Recebemos o seu pagamento referente à marcação {{booking_id}}.'),
  ('payout_recorded','pt-PT',
   'Pagamento ao profissional registado',
   'Foi registado um pagamento de {{amount}} referente à marcação {{booking_id}}.'),
  ('booking_available','pt-PT',
   'Nova marcação disponível',
   'Está disponível uma marcação ({{booking_id}}) compatível com a sua função.'),
  ('compliance_rejected','pt-PT',
   'Um documento de conformidade não foi aceite',
   'Um dos seus documentos de conformidade não foi aceite. Motivo: {{reason}}. Inicie sessão e carregue um documento atualizado para que a sua candidatura possa prosseguir.'),
  ('further_info_required','pt-PT',
   'São necessárias mais informações sobre os seus documentos de conformidade',
   'Precisamos de mais informações sobre um dos seus documentos de conformidade. {{reason}} Inicie sessão para rever e atualizar os seus documentos.'),
  ('professional_rejected','pt-PT',
   'A sua candidatura à CareBridge Connect não foi aprovada',
   'A sua candidatura não foi aprovada nesta fase. Motivo: {{reason}}. Se acreditar que isto é um erro, contacte a CareBridge Connect.'),
  ('account_removed','pt-PT',
   'A sua conta CareBridge Connect foi removida',
   'A sua conta de profissional foi removida. Motivo: {{reason}}. Contacte a CareBridge Connect se tiver alguma questão.'),
  ('professional_suspended','pt-PT',
   'Foi aplicada uma restrição à sua conta CareBridge Connect',
   'Foi aplicada uma restrição ({{action}}) à sua conta. Motivo: {{reason}}. Enquanto estiver em vigor, pode continuar a ver marcações disponíveis mas não pode aceitar novas. Contacte a CareBridge Connect para mais detalhes.'),
  ('timesheet_submitted','pt-PT',
   'Horas submetidas na sua marcação',
   'O profissional submeteu {{worked_hours}} horas referentes à marcação {{booking_id}}. É favor revê-las e confirmá-las para que o pagamento possa ser libertado.'),
  ('timesheet_confirmed','pt-PT',
   'As suas horas foram confirmadas',
   'As horas que submeteu para a marcação {{booking_id}} foram confirmadas. O seu pagamento seguir-se-á.'),
  ('timesheet_disputed','pt-PT',
   'Foi levantada uma questão sobre as suas horas',
   'O cliente colocou uma questão sobre as horas submetidas para a marcação {{booking_id}}. Motivo: {{reason}}. Um administrador irá contactá-lo.'),
  ('message_received','pt-PT',
   'Tem uma nova mensagem na CareBridge Connect',
   'Tem uma nova mensagem sobre "{{subject}}". Inicie sessão para ler e responder.')
on conflict (type, locale) do nothing;
