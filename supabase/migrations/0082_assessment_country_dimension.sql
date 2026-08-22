-- Portugal Phase 2 — the assessment becomes country-aware.
--
-- Ana was explicit: Portuguese professionals must not receive the same
-- questions as UK professionals. Questions gain a country dimension; the
-- existing English bank is backfilled to GB, and a Portuguese common pool is
-- seeded below so a PT applicant sits a full, coherent assessment in
-- Portuguese from day one.
--
-- Role-specific Portuguese banks are deliberately not here yet: role shortfall
-- tops up from the common pool (the established behaviour), and real per-role
-- banks are an outstanding input from the client — exactly as they are for the
-- UK. When her question bank arrives it lands as data rows, no schema change.

alter table assessment_question_bank
  add column if not exists country_code char(2) references countries(code);

-- The existing bank is English UK content in every case.
update assessment_question_bank set country_code = 'GB' where country_code is null;

/* -------------------------------------------- Portuguese common pool ---- */
/* Generic compliance questions any CareBridge Connect professional in
   Portugal answers — safeguarding, GDPR, health & safety, record keeping,
   professional boundaries, IPC and role-specific practice. Placeholders in
   the same sense the UK ones are: awaiting the client's final bank.          */

insert into assessment_question_bank
  (professional_role_id, country_code, topic, question_text, options, correct_option) values

  (null,'PT','safeguarding',
   'O que deve fazer se suspeitar que uma criança ou adulto vulnerável está a ser maltratado?',
   '["Confrontar diretamente a pessoa suspeita","Registar as observações e comunicar de imediato à CareBridge Connect e às autoridades competentes","Esperar para ver se a situação se repete","Discutir o caso com outros clientes"]'::jsonb,
   'Registar as observações e comunicar de imediato à CareBridge Connect e às autoridades competentes'),

  (null,'PT','safeguarding',
   'Um cliente lhe pede para guardar segredo sobre algo que o preocupa. O que faz?',
   '["Promete manter segredo porque a confiança é importante","Explica com calma que não pode prometer sigilo e segue o procedimento de proteção","Ignora o pedido e muda de assunto","Publica a situação nas redes sociais"]'::jsonb,
   'Explica com calma que não pode prometer sigilo e segue o procedimento de proteção'),

  (null,'PT','gdpr_confidentiality',
   'Pode partilhar informação clínica ou pessoal de um cliente com um membro da família sem autorização?',
   '["Sim, se a família pagar pelo serviço","Não, exceto com consentimento válido ou obrigação legal","Sim, se for informação pequena","Apenas por mensagem privada"]'::jsonb,
   'Não, exceto com consentimento válido ou obrigação legal'),

  (null,'PT','gdpr_confidentiality',
   'Onde pode guardar notas sobre os cuidados prestados a um cliente?',
   '["Num caderno pessoal em casa","Apenas nos sistemas aprovados pela CareBridge Connect","Num grupo de mensagens com colegas","Na galeria do seu telemóvel"]'::jsonb,
   'Apenas nos sistemas aprovados pela CareBridge Connect'),

  (null,'PT','professional_boundaries',
   'Um cliente oferece-lhe um presente caro no fim da marcação. O que faz?',
   '["Aceita, afinal é gentileza","Recusa com educação e segue a política de presentes da plataforma","Pede dinheiro em vez do presente","Aceita apenas se ninguém souber"]'::jsonb,
   'Recusa com educação e segue a política de presentes da plataforma'),

  (null,'PT','professional_boundaries',
   'Pode tornar-se amiga pessoal de um cliente nas redes sociais durante um acompanhamento?',
   '["Sim, ajuda a criar confiança","Não — mantenha limites profissionais durante o cuidado","Sim, se o cliente insistir","Apenas no LinkedIn"]'::jsonb,
   'Não — mantenha limites profissionais durante o cuidado'),

  (null,'PT','health_safety',
   'Encontra uma poça de água no chão da cozinha do cliente durante a visita. O que faz primeiro?',
   '["Deixa para o cliente limpar mais tarde","Sinaliza e limpa de imediato para evitar quedas","Liga para outro profissional","Continua o trabalho com cuidado"]'::jsonb,
   'Sinaliza e limpa de imediato para evitar quedas'),

  (null,'PT','health_safety',
   'Em caso de incêndio na habitação do cliente, qual é a primeira ação?',
   '["Apaga o fogo sozinho","Mantém-se a trabalhar","Põe as pessoas em segurança e chama os bombeiros (112)","Filma o incidente"]'::jsonb,
   'Põe as pessoas em segurança e chama os bombeiros (112)'),

  (null,'PT','infection_prevention_control',
   'Quando deve higienizar as mãos durante uma visita domiciliária?',
   '["Uma vez no início da visita","Antes e depois do contacto direto e após luvas","Apenas se as mãos parecerem sujas","No fim do dia"]'::jsonb,
   'Antes e depois do contacto direto e após luvas'),

  (null,'PT','infection_prevention_control',
   'Está com sintomas de doença infeciosa aguda (febre, vómitos). O que faz?',
   '["Vai à marcação com máscara","Informa de imediato a CareBridge Connect e não comparece ao turno","Reduz as horas do turno","Toma analgésicos e segue"]'::jsonb,
   'Informa de imediato a CareBridge Connect e não comparece ao turno'),

  (null,'PT','documentation_record_keeping',
   'Quando deve registar os cuidados prestados?',
   '["Sempre que se lembrar","No fim do mês","Logo após os cuidados, de forma exata e objetiva","Nunca — o cliente regista"]'::jsonb,
   'Logo após os cuidados, de forma exata e objetiva'),

  (null,'PT','documentation_record_keeping',
   'O que torna um bom registo de cuidados?',
   '["Opiniões pessoais sobre o cliente","Factos objetivos, precisos, com data e hora","Abreviaturas pessoais","Notas escritas dias depois"]'::jsonb,
   'Factos objetivos, precisos, com data e hora'),

  (null,'PT','medication_awareness',
   'O cliente pede ajuda com a medicação fora do âmbito autorizado da sua função. O que faz?',
   '["Ajuda mesmo assim para ser útil","Explica os limites do seu âmbito de prática e segue o plano de cuidados acordado","Esconde a situação","Dobra a dose seguinte"]'::jsonb,
   'Explica os limites do seu âmbito de prática e segue o plano de cuidados acordado'),

  (null,'PT','medication_awareness',
   'Nota que um frasco de medicamento está com etiqueta ilegível. Qual é a atitude correta?',
   '["Adivinha pela cor dos comprimidos","Não administra e comunica de imediato ao cliente ou gestor conforme o plano","Administra metade da dose","Marca o frasco com caneta"]'::jsonb,
   'Não administra e comunica de imediato ao cliente ou gestor conforme o plano'),

  (null,'PT','role_specific',
   'Como confirma a sua identidade ao chegar a uma marcação pela primeira vez?',
   '["Não precisa, já esperam por si","Mostra identificação e segue o processo de check-in da plataforma","Envia uma selfie","Deixa o cliente adivinhar"]'::jsonb,
   'Mostra identificação e segue o processo de check-in da plataforma'),

  (null,'PT','role_specific',
   'O horário acordado termina mas a família pede para ficar mais tempo sem avisar a plataforma. O que faz?',
   '["Fica, é ajuda rápida","Recusa educadamente e explica que alterações passam pela CareBridge Connect","Fica e cobra diretamente","Sai sem avisar"]'::jsonb,
   'Recusa educadamente e explica que alterações passam pela CareBridge Connect'),

  (null,'PT','role_specific',
   'Quem paga o profissional pelos cuidados prestados numa marcação da plataforma?',
   '["O cliente entrega o dinheiro em mão","Ninguém — é voluntário","A CareBridge Connect, após as horas confirmadas segundo o fluxo de pagamentos acordado","O hospital onde o cliente esteve internado"]'::jsonb,
   'A CareBridge Connect, após as horas confirmadas segundo o fluxo de pagamentos acordado'),

  (null,'PT','role_specific',
   'Qual destes documentos tem de manter válido para aceitar marcações em Portugal?',
   '["Carta de condução, mesmo expirada","Certificado de registo criminal aplicável, identificação e direito ao trabalho/residência válidos","Apenas o certificado de nascimento","Nenhum documento é necessário"]'::jsonb,
   'Certificado de registo criminal aplicável, identificação e direito ao trabalho/residência válidos'),

  (null,'PT','safeguarding',
   'Repara em hematomas inexplicados num cliente. Qual é a resposta correta?',
   '["Ignora — não é da sua conta","Fotografa e partilha com amigos","Regista objetivamente e comunica de imediato pelo canal acordado","Acusa diretamente o familiar"]'::jsonb,
   'Regista objetivamente e comunica de imediato pelo canal acordado'),

  (null,'PT','gdpr_confidentiality',
   'Um jornalista liga a pedir informação sobre um cliente seu. O que responde?',
   '["Dá os detalhes básicos","Não partilha nada e informa a CareBridge Connect","Negocia uma entrevista","Confirma apenas o nome"]'::jsonb,
   'Não partilha nada e informa a CareBridge Connect');
