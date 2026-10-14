/**
 * The Portuguese legal pack — CareBridge Connect Portugal's website legal
 * documents, as reviewed and sent by Ana on 12 October 2026
 * (DOC-20261012-WA0016, "Bilingual Website Legal Pack").
 *
 * The European Portuguese text governs users in Portugal; the English text is
 * the pack's own convenience translation and is reproduced as supplied (it is
 * shorter than the Portuguese in places — that is the reviewed text, not an
 * omission here). Only section-heading punctuation and one agreement typo
 * ("sujeito à procedimentos" → "sujeito aos procedimentos") are corrected.
 *
 * The geographic address is still to come from Ana: until
 * NEXT_PUBLIC_PT_COMPANY_ADDRESS is set the documents keep the pack's own
 * "to be inserted before publication" wording.
 */
import type { LegalSection } from "@/data/legal-copy";
import { PT_COMPANY_ADDRESS, PT_COMPANY_ADDRESS_CONFIGURED } from "@/lib/site";

export type LegalLang = "pt" | "en";

export type LegalDoc = {
  title: string;
  /** Paragraphs under the title, before the first numbered section. */
  intro?: readonly string[];
  sections: readonly LegalSection[];
  /** Identification lines shown as a label/value list (the legal notice). */
  facts?: readonly { label: string; value: string; href?: string }[];
};

export type LegalDocKey =
  | "generalTerms"
  | "professionalTerms"
  | "privacy"
  | "cookies"
  | "cancellation"
  | "complaints"
  | "legalNotice";

export const PT_LEGAL_ENTITY = "CAREBRIDGE CONNECT, UNIPESSOAL LDA";
export const PT_NIPC = "519 640 870";
export const PT_PHONE = "+351 926 562 988";
export const PT_EMAILS = {
  general: "info@carebridgeconnects.com",
  support: "support@carebridgeconnects.com",
  privacy: "privacy@carebridgeconnects.com",
} as const;

/** The date the texts on the site last changed. */
export const PT_LEGAL_UPDATED = { iso: "2026-10-14", pt: "14 de outubro de 2026", en: "14 October 2026" } as const;

/** Where each document lives; the order is the order of the legal index. */
export const PT_LEGAL_ROUTES: Record<LegalDocKey, string> = {
  generalTerms: "/terms/clients",
  professionalTerms: "/terms/professionals",
  privacy: "/privacy",
  cookies: "/cookies",
  cancellation: "/cancellation-policy",
  complaints: "/complaints",
  legalNotice: "/legal-notice",
};

const address = PT_COMPANY_ADDRESS_CONFIGURED ? PT_COMPANY_ADDRESS : null;

const pt: Record<LegalDocKey, LegalDoc> = {
  generalTerms: {
    title: "Termos de Utilização e Condições Gerais",
    sections: [
      {
        title: "1. Identificação e âmbito",
        paragraphs: [
          `A plataforma CareBridge Connect Portugal é operada por ${PT_LEGAL_ENTITY}, NIPC ${PT_NIPC}, ${address ? `com endereço geográfico em ${address}` : "com endereço geográfico a inserir antes da publicação"}, contacto telefónico ${PT_PHONE} e apoio através de ${PT_EMAILS.support}.`,
          "Estes Termos regulam o acesso ao sítio carebridgeconnects.com e a utilização da plataforma por clientes particulares, representantes de clientes, famílias e organizações. Ao criar uma conta ou efetuar uma reserva, o utilizador declara ter lido e aceite estes Termos.",
        ],
      },
      {
        title: "2. Natureza da plataforma",
        paragraphs: [
          "A CareBridge disponibiliza uma plataforma digital de intermediação que permite procurar, selecionar, reservar e pagar serviços prestados por profissionais independentes nas áreas da saúde, apoio domiciliário, apoio social, fisioterapia e cuidados infantis, de acordo com as categorias disponíveis.",
          "Salvo indicação expressa em contrário na plataforma, a CareBridge não é a entidade empregadora do profissional nem o substitui na prestação do serviço. O contrato relativo ao serviço reservado é celebrado entre o cliente ou a organização e o profissional independente. A CareBridge gere a tecnologia, a verificação documental, as reservas, os pagamentos e o apoio operacional nos limites descritos nestes Termos.",
          "A verificação realizada pela CareBridge reduz riscos, mas não constitui garantia absoluta de conduta, adequação, disponibilidade ou resultado clínico, terapêutico, social ou educativo.",
        ],
      },
      {
        title: "3. Elegibilidade e contas",
        paragraphs: [
          "O utilizador deve ter capacidade legal para contratar e fornecer informação completa, verdadeira e atualizada. As credenciais de acesso são pessoais e não podem ser partilhadas. A CareBridge pode solicitar prova de identidade, de representação ou de poderes para agir em nome de outra pessoa ou organização.",
          "O utilizador é responsável pela atividade realizada através da sua conta, salvo quando demonstre utilização não autorizada que tenha comunicado sem demora.",
        ],
      },
      {
        title: "4. Pedidos e reservas",
        paragraphs: [
          "O cliente deve descrever corretamente as necessidades, o local, o horário, os riscos conhecidos, as condições de acesso e qualquer informação essencial à segurança. A plataforma apresenta disponibilidade e preços antes da confirmação.",
          "Uma reserva apenas fica confirmada quando a plataforma emite uma confirmação eletrónica e o pagamento é efetuado ou a autorização de pagamento é aceite. A CareBridge pode recusar ou cancelar pedidos ilegais, inseguros, discriminatórios, inexequíveis ou fora do âmbito anunciado.",
        ],
      },
      {
        title: "5. Serviços urgentes e emergências",
        paragraphs: [
          "A CareBridge não é um serviço de emergência e não deve ser utilizada para obter assistência médica urgente. Em caso de emergência, o utilizador deve contactar o 112 ou os serviços de emergência adequados.",
        ],
      },
      {
        title: "6. Preços, pagamentos e faturação",
        paragraphs: [
          "O preço total, a remuneração bruta do profissional, a comissão da plataforma, os impostos aplicáveis e quaisquer encargos serão apresentados antes da confirmação. A CareBridge deduz uma comissão de 17% da remuneração bruta acordada com o profissional. O cliente paga o preço total apresentado antes da reserva e o profissional vê o valor bruto, a comissão e o pagamento líquido antes de aceitar.",
          "Os pagamentos são processados por um prestador externo de serviços de pagamento, incluindo o Stripe. A CareBridge não armazena os dados completos do cartão. O pagamento ao profissional apenas será disponibilizado após a conclusão e confirmação do serviço, sujeito aos procedimentos de resolução de litígios, reembolsos e prevenção de fraude.",
          "A emissão de faturas ou recibos referentes ao serviço e à comissão seguirá o modelo fiscal confirmado pelo contabilista e configurado na plataforma antes do lançamento.",
        ],
      },
      {
        title: "7. Cancelamentos, reembolsos e não comparência",
        paragraphs: [
          "Aplicam-se a Política de Cancelamento e Reembolso e as regras apresentadas antes da reserva: o cancelamento com mais de 24 horas de antecedência dá lugar a reembolso integral; com uma antecedência entre 2 e 24 horas, pode ser cobrado 50% do preço; com menos de 2 horas de antecedência ou em caso de não comparência do cliente, pode ser cobrado o preço total. As circunstâncias excecionais serão analisadas individualmente. Nenhuma regra limita os direitos imperativos do consumidor.",
          "Quando o cliente solicitar expressamente que um serviço pago se inicie durante o prazo legal de livre resolução, poderá ser devido um valor proporcional ao serviço já prestado. Se o serviço tiver sido integralmente prestado após a obtenção do consentimento prévio e do reconhecimento exigidos, o direito de livre resolução poderá cessar nos termos legais.",
        ],
      },
      {
        title: "8. Conduta e segurança",
        paragraphs: [
          "Os utilizadores devem tratar todas as pessoas com respeito, proporcionar um ambiente seguro, cumprir as instruções razoáveis de segurança e não solicitar atividades ilegais ou fora das competências do profissional. É proibido assediar, ameaçar, discriminar, explorar ou tentar contornar os mecanismos de proteção da plataforma.",
          "A CareBridge pode suspender uma reserva ou conta perante risco de segurança, fraude, abuso, documentação inválida, incumprimento material ou exigência legal. Sempre que aplicável, será comunicada a razão e disponibilizado um meio de contestação.",
        ],
      },
      {
        title: "9. Avaliações e conteúdos",
        paragraphs: [
          "As avaliações devem refletir experiências reais e não podem conter informação falsa, abusiva, discriminatória, confidencial ou ilegal. A CareBridge pode moderar conteúdos de acordo com a lei e estes Termos, mantendo registo da decisão quando exigido.",
        ],
      },
      {
        title: "10. Responsabilidade",
        paragraphs: [
          "Nada nestes Termos exclui responsabilidade que não possa ser excluída por lei. A CareBridge responde pelos seus próprios atos e omissões nos termos legais. A sua responsabilidade não se estende a perdas causadas exclusivamente por informação falsa do utilizador, incumprimento do profissional independente ou circunstâncias fora do controlo razoável da plataforma, sem prejuízo dos direitos imperativos do consumidor.",
        ],
      },
      {
        title: "11. Reclamações e litígios",
        paragraphs: [
          `As reclamações podem ser enviadas para ${PT_EMAILS.support}. A CareBridge disponibilizará acesso ao Livro de Reclamações Eletrónico e indicará a entidade de resolução alternativa de litígios competente antes da publicação.`,
        ],
      },
      {
        title: "12. Alterações e cessação",
        paragraphs: [
          "A CareBridge pode alterar os Termos por motivos legais, técnicos, de segurança ou de funcionamento. As alterações substanciais serão comunicadas com antecedência razoável. As condições aceites no momento da reserva continuam aplicáveis a essa reserva, salvo exigência legal em contrário.",
          "O utilizador pode encerrar a conta, sem prejuízo dos pagamentos, reservas, reclamações ou obrigações fiscais ainda pendentes e dos períodos legais de conservação de dados aplicáveis.",
        ],
      },
      {
        title: "13. Lei aplicável",
        paragraphs: [
          "Aplica-se a lei portuguesa. Os consumidores mantêm todos os direitos imperativos e podem recorrer aos tribunais e mecanismos de resolução de litígios competentes nos termos legais.",
        ],
      },
    ],
  },

  professionalTerms: {
    title: "Termos para Profissionais Independentes",
    sections: [
      {
        title: "1. Relação independente",
        paragraphs: [
          "O profissional utiliza a plataforma por conta própria e, salvo acordo escrito em contrário, atua como prestador de serviços independente. Estes Termos não criam um contrato de trabalho, uma sociedade, um mandato geral ou uma relação de exclusividade. A classificação jurídica depende da realidade da relação e das regras imperativas aplicáveis.",
          "O profissional decide se pretende candidatar-se ou aceitar oportunidades disponíveis, dentro das regras da plataforma e das reservas já aceites. É responsável pelas suas obrigações fiscais, contributivas, profissionais e de faturação.",
        ],
      },
      {
        title: "2. Admissão e verificação",
        paragraphs: [
          "A ativação exige registo, avaliação inicial e aprovação administrativa. Consoante a função, podem ser exigidos documentos de identificação e comprovativos do direito a trabalhar em Portugal, NIF, NISS, comprovativo de início de atividade nas Finanças, certificado de registo criminal, qualificações, inscrição profissional, autorizações aplicáveis, seguros, referências ou curriculum vitae (CV) e IBAN.",
          "Os requisitos relativos à ordem profissional, ao Instituto da Segurança Social (ISS), ao registo como ama, ao registo criminal de outro país ou a documentos adicionais são exigidos apenas quando aplicáveis. A CareBridge pode validar a informação junto das entidades competentes e solicitar originais ou documentos atualizados.",
        ],
      },
      {
        title: "3. Avaliação e estado da conta",
        paragraphs: [
          "A avaliação inicial exige uma classificação mínima de 80% e permite um máximo de três tentativas, salvo alteração previamente comunicada. Trata-se de uma avaliação de admissão da CareBridge, que não constitui uma qualificação acreditada nem substitui as habilitações legalmente exigidas.",
          "O profissional não pode aceitar trabalho antes da aprovação. Documentos em falta, caducados, suspeitos ou inconsistentes podem impedir a aprovação ou provocar a suspensão automática da conta até à regularização da situação.",
        ],
      },
      {
        title: "4. Prestação dos serviços",
        paragraphs: [
          "O profissional deve atuar dentro dos limites das suas competências, qualificações, cobertura de seguro e autorização legal; cumprir as reservas aceites; manter registos adequados; respeitar a confidencialidade, a dignidade e o consentimento; proteger menores e adultos vulneráveis; e comunicar incidentes, atrasos, riscos e qualquer impossibilidade de comparecer.",
          "O profissional deve recusar tarefas para as quais não tenha competência, cobertura de seguro ou autorização legal. Em caso de emergência, deve seguir os procedimentos adequados e contactar o 112 quando necessário.",
        ],
      },
      {
        title: "5. Preços, comissão e pagamentos",
        paragraphs: [
          "Os preços e a remuneração são apresentados antes da aceitação da reserva. A CareBridge deduz uma comissão de 17% da remuneração bruta do profissional. Antes de aceitar, o profissional verá o valor bruto, a comissão da CareBridge e o pagamento líquido previsto.",
          "O pagamento é processado através do prestador de serviços de pagamento da plataforma. O pagamento ao profissional é disponibilizado após a conclusão e confirmação do serviço, deduzidas as quantias previamente comunicadas e legalmente devidas. A CareBridge pode reter temporariamente valores em caso de litígio, suspeita de fraude, reembolso, estorno de pagamento (chargeback) ou obrigação legal.",
        ],
      },
      {
        title: "6. Cancelamentos e não comparência",
        paragraphs: [
          "O profissional deve cancelar apenas por motivo justificado e com a maior antecedência possível. Cancelamentos tardios, faltas, atrasos repetidos ou abandono podem resultar em investigação, redução de acesso ou suspensão, de acordo com a política publicada e o princípio da proporcionalidade.",
        ],
      },
      {
        title: "7. Seguros, impostos e contribuições",
        paragraphs: [
          "O profissional é responsável por manter os seguros exigidos, declarar rendimentos, emitir os documentos fiscais aplicáveis e cumprir as suas obrigações perante a Autoridade Tributária e Aduaneira, a Segurança Social, a ordem profissional ou outra entidade competente. A CareBridge não presta aconselhamento fiscal individual.",
        ],
      },
      {
        title: "8. Proteção de dados e confidencialidade",
        paragraphs: [
          "O profissional apenas pode aceder a dados necessários à reserva e utilizá-los para prestar o serviço. É proibido copiar, partilhar ou utilizar dados para fins próprios, marketing ou contacto fora da plataforma, salvo consentimento válido ou obrigação legal.",
        ],
      },
      {
        title: "9. Incidentes, reclamações e cooperação",
        paragraphs: [
          "Os incidentes relacionados com segurança, proteção de menores ou adultos vulneráveis, medicação, acidentes, violações de dados ou conduta imprópria, bem como as reclamações, devem ser comunicados imediatamente através do canal definido. O profissional deve colaborar nas verificações e conservar os elementos de prova relevantes.",
        ],
      },
      {
        title: "10. Suspensão e cessação",
        paragraphs: [
          "A CareBridge pode suspender preventivamente o perfil quando exista risco sério, documento caducado, suspeita de fraude, reclamação grave ou exigência legal. Sempre que a lei e a segurança o permitam, o profissional será informado dos motivos e poderá apresentar esclarecimentos ou contestação.",
          "O profissional pode deixar a plataforma depois de concluir ou transferir de forma segura as reservas e obrigações pendentes.",
        ],
      },
      {
        title: "11. Prevenção da evasão à comissão e contacto direto",
        paragraphs: [
          "O profissional não deve utilizar informação obtida através da plataforma para desviar reservas confirmadas ou propostas para pagamento externo com a finalidade de evitar a comissão, quando tal restrição esteja prevista de forma transparente, razoável e legal na versão final aprovada.",
        ],
      },
      {
        title: "12. Lei e litígios",
        paragraphs: [
          "Aplica-se a lei portuguesa. As partes procurarão resolver reclamações de boa-fé antes de recorrer aos meios judiciais competentes, sem prejuízo de direitos imperativos.",
        ],
      },
    ],
  },

  privacy: {
    title: "Política de Privacidade",
    sections: [
      {
        title: "1. Responsável pelo tratamento",
        paragraphs: [
          `${PT_LEGAL_ENTITY}, NIPC ${PT_NIPC}, é responsável pelos tratamentos descritos nesta Política quando determina as finalidades e os meios do tratamento. Contacto de privacidade: ${PT_EMAILS.privacy}. ${address ? `Endereço geográfico: ${address}.` : "O endereço geográfico será inserido antes da publicação."}`,
        ],
      },
      {
        title: "2. Dados tratados",
        bullets: [
          "Dados de identificação, contacto, autenticação e representação.",
          "Dados de perfil profissional, NIF, NISS, atividade nas Finanças, qualificações, inscrições, seguros, referências, CV, IBAN e estado de verificação.",
          "Registos criminais e outros documentos de conformidade quando legalmente necessários e proporcionais.",
          "Dados de reservas, disponibilidade, localização do serviço, pagamentos, reembolsos, faturas, comunicações e apoio.",
          "Informação sobre necessidades de cuidados ou de saúde fornecida para organizar um serviço, que pode incluir categorias especiais de dados.",
          "Dados técnicos, endereço IP, informações sobre o dispositivo, cookies e registos de segurança e de auditoria.",
        ],
      },
      {
        title: "3. Finalidades e fundamentos",
        paragraphs: [
          "Tratamos dados para criar e gerir contas; verificar profissionais; organizar reservas e assegurar a prestação dos serviços reservados; processar pagamentos; prestar apoio; prevenir fraudes e incidentes; cumprir obrigações legais, fiscais e regulamentares; resolver reclamações; melhorar a plataforma; e enviar comunicações de marketing quando exista consentimento ou outro fundamento válido.",
          "Os fundamentos jurídicos podem incluir diligências pré-contratuais, execução de contratos, cumprimento de obrigações legais, interesses legítimos previamente avaliados e consentimento, bem como, para categorias especiais de dados, as condições adicionais previstas no artigo 9.º do RGPD. O fundamento específico de cada atividade de tratamento deve ser validado antes do lançamento.",
        ],
      },
      {
        title: "4. Dados de saúde e pessoas vulneráveis",
        paragraphs: [
          "A plataforma recolhe apenas a informação estritamente necessária para selecionar e prestar o serviço de forma segura. Não devem ser enviados relatórios clínicos completos quando uma descrição limitada seja suficiente. O acesso é limitado a pessoas autorizadas e ao profissional responsável pelo serviço. A informação sobre saúde será tratada apenas quando esteja preenchida uma condição válida prevista no artigo 9.º do RGPD, incluindo o consentimento explícito quando esse for o fundamento aplicável.",
          "Quanto ao registo criminal, a CareBridge limitará a recolha às funções em que a verificação seja legalmente necessária e proporcional. Sempre que possível, conservará apenas o resultado, a data e a validade da verificação, eliminando a cópia integral logo que deixe de ser necessária.",
        ],
      },
      {
        title: "5. Origem e partilha",
        paragraphs: [
          "Os dados são obtidos do titular, do seu representante, da organização que efetua a reserva, do profissional, de entidades de validação e dos sistemas utilizados na prestação do serviço.",
          "Podemos partilhar os dados necessários com o cliente, a organização ou o profissional em causa; fornecedores de serviços de alojamento, bases de dados, correio eletrónico, apoio, pagamentos, prevenção de fraude, análise e segurança; consultores; autoridades; e entidades reguladoras, quando exista fundamento jurídico.",
        ],
      },
      {
        title: "6. Prestadores e transferências internacionais",
        paragraphs: [
          "A CareBridge utiliza prestadores de serviços tecnológicos, incluindo serviços de alojamento, bases de dados, pagamentos e correio eletrónico. A lista final de prestadores, respetivas localizações e mecanismos de transferência internacional será documentada antes da publicação. Quando os dados sejam transferidos para fora do Espaço Económico Europeu (EEE), serão utilizadas decisões de adequação, cláusulas contratuais-tipo ou outro mecanismo válido.",
        ],
      },
      {
        title: "7. Conservação",
        paragraphs: [
          "Os dados são conservados apenas durante o período necessário às respetivas finalidades e ao cumprimento das obrigações legais. Antes da publicação, será aprovada uma tabela de prazos de conservação para contas, documentos de conformidade, reservas, pagamentos, comunicações, incidentes, auditorias e marketing.",
        ],
      },
      {
        title: "8. Direitos",
        paragraphs: [
          "O titular pode exercer os direitos de acesso, retificação, apagamento, limitação do tratamento, oposição e portabilidade, retirar o consentimento e apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD). Alguns direitos podem ser limitados por obrigações legais, direitos de terceiros, razões de segurança ou pela necessidade de exercer ou defender direitos.",
        ],
      },
      {
        title: "9. Decisões automatizadas e IA",
        paragraphs: [
          "A CareBridge não deverá tomar decisões com efeitos jurídicos significativos exclusivamente por meios automatizados sem fundamento jurídico, informação adequada e garantias aplicáveis. Durante o projeto-piloto, as ferramentas de inteligência artificial (IA) não substituem a avaliação humana nas aprovações, suspensões ou decisões de segurança.",
        ],
      },
      {
        title: "10. Segurança e incidentes",
        paragraphs: [
          "São aplicadas medidas técnicas e organizativas proporcionais, incluindo controlo de acesso, registos de auditoria, encriptação adequada, cópias de segurança e procedimentos de resposta a incidentes. Nenhum sistema é totalmente isento de risco. Os incidentes serão avaliados e notificados quando tal seja legalmente exigido.",
        ],
      },
      {
        title: "11. Contactos e reclamações",
        paragraphs: [
          `Os pedidos relativos à privacidade devem ser enviados para ${PT_EMAILS.privacy}. O titular pode apresentar reclamação junto da CNPD em www.cnpd.pt.`,
        ],
      },
    ],
  },

  cookies: {
    title: "Política de Cookies",
    intro: [
      "A CareBridge utiliza cookies e tecnologias semelhantes para funcionamento, segurança, preferências e, mediante consentimento quando exigido, análise e marketing.",
    ],
    sections: [
      {
        title: "Categorias",
        bullets: [
          "Estritamente necessários: autenticação, segurança, gestão de sessão e preferências essenciais.",
          "Preferências: idioma, região e escolhas guardadas.",
          "Análise: medição da utilização e do desempenho, ativada apenas nos termos legalmente permitidos.",
          "Marketing: publicidade e medição de campanhas, apenas após consentimento quando exigido.",
        ],
        after: [
          "O aviso de cookies deve permitir aceitar, rejeitar e gerir as categorias com igual facilidade. Os cookies não essenciais não devem ser instalados antes de uma escolha válida. A lista de cookies, fornecedores, finalidades e prazos de duração será gerada a partir da configuração real do sítio eletrónico antes da publicação.",
        ],
      },
    ],
  },

  cancellation: {
    title: "Política de Cancelamento e Reembolso",
    intro: [
      "Esta política deve ser apresentada antes de cada reserva e configurada de forma coerente no sítio eletrónico, nas mensagens de correio eletrónico e no Stripe.",
    ],
    sections: [
      {
        title: "Princípios",
        bullets: [
          "O cliente pode cancelar através da conta ou do apoio, recebendo confirmação em suporte duradouro.",
          "Qualquer encargo deve ser proporcional, transparente e mostrado antes da reserva.",
          "Se o profissional cancelar, a CareBridge tentará substituir o profissional ou reembolsará os valores correspondentes ao serviço não prestado.",
          "Os reembolsos aprovados serão efetuados através do meio de pagamento original e estarão sujeitos aos prazos de processamento do prestador de serviços de pagamento.",
          "Os direitos legais do consumidor, incluindo o direito de livre resolução quando aplicável, prevalecem sobre a política comercial.",
          "Os litígios relativos à conclusão, qualidade ou segurança do serviço serão analisados antes de o pagamento ao profissional ser disponibilizado.",
        ],
      },
      {
        title: "Tabela de cancelamentos",
        table: {
          headers: ["Situação", "Aviso", "Cliente", "Profissional"],
          rows: [
            ["Cancelamento antecipado", "> 24 horas", "Reembolso integral", "Sem pagamento"],
            ["Cancelamento tardio", "2 a 24 horas", "Cobrança de 50%", "Pagamento líquido proporcional, sujeito à política"],
            ["Cancelamento tardio", "< 2 horas", "Cobrança até 100%", "Pagamento líquido, sujeito à política"],
            ["Não comparência do cliente", "Sem aviso", "Cobrança até 100%", "Pagamento líquido, sujeito à política"],
            ["Não comparência do profissional", "Qualquer", "Reembolso integral do serviço não prestado", "Sem pagamento e revisão do perfil"],
            ["Serviço interrompido por segurança", "Caso a caso", "Revisão e reembolso proporcional", "Revisão e pagamento proporcional"],
          ],
        },
      },
    ],
  },

  complaints: {
    title: "Reclamações e Resolução de Litígios",
    intro: [
      `O utilizador pode apresentar uma reclamação através de ${PT_EMAILS.support}. A CareBridge acusará a receção e procurará responder dentro do prazo legal aplicável.`,
      "Livro de Reclamações Eletrónico: www.livroreclamacoes.pt. A ligação direta deve estar visível no site após o registo da empresa no serviço.",
      "Resolução alternativa de litígios de consumo: a entidade ou as entidades competentes para a atividade e a área geográfica inicial de prestação dos serviços serão confirmadas antes da publicação. A informação deve incluir os respetivos nomes, contactos e sítios eletrónicos. O consumidor pode ainda consultar a Direção-Geral do Consumidor em www.consumidor.gov.pt.",
    ],
    sections: [],
  },

  legalNotice: {
    title: "Aviso Legal e Identificação",
    sections: [],
    facts: [
      { label: "Operador", value: PT_LEGAL_ENTITY },
      { label: "NIPC", value: PT_NIPC },
      {
        label: "Endereço geográfico",
        value: address ?? "a inserir antes da publicação após confirmação jurídica e alteração de sede, se aplicável",
      },
      { label: "Telefone", value: PT_PHONE, href: `tel:${PT_PHONE.replace(/\s/g, "")}` },
      { label: "Correio eletrónico geral", value: PT_EMAILS.general, href: `mailto:${PT_EMAILS.general}` },
      { label: "Apoio", value: PT_EMAILS.support, href: `mailto:${PT_EMAILS.support}` },
      { label: "Privacidade", value: PT_EMAILS.privacy, href: `mailto:${PT_EMAILS.privacy}` },
      { label: "Livro de Reclamações Eletrónico", value: "www.livroreclamacoes.pt", href: "https://www.livroreclamacoes.pt/" },
    ],
  },
};

const en: Record<LegalDocKey, LegalDoc> = {
  generalTerms: {
    title: "Website Terms of Use and General Conditions",
    sections: [
      {
        title: "1. Identity and scope",
        paragraphs: [
          `The CareBridge Connect Portugal platform is operated by ${PT_LEGAL_ENTITY}, Portuguese company number ${PT_NIPC}, ${address ? `with its geographic address at ${address}` : "with its geographic address to be inserted before publication"}, telephone ${PT_PHONE} and support at ${PT_EMAILS.support}.`,
          "These Terms govern access to carebridgeconnects.com and use of the platform by individual clients, client representatives, families and organisations. By creating an account or making a booking, the user confirms that they have read and accepted these Terms.",
        ],
      },
      {
        title: "2. Nature of the platform",
        paragraphs: [
          "CareBridge provides a digital marketplace through which users can search for, select, book and pay independent professionals offering healthcare, home support, social support, physiotherapy and childcare services in the categories made available.",
          "Unless expressly stated otherwise, CareBridge is not the professional's employer and does not itself replace the professional in delivering the booked service. The service contract is between the client or organisation and the independent professional. CareBridge administers the technology, document checks, booking, payment and operational support described in these Terms.",
          "CareBridge checks reduce risk but are not an absolute guarantee of conduct, suitability, availability, or any clinical, therapeutic, social or educational outcome.",
        ],
      },
      {
        title: "3. Eligibility and accounts",
        paragraphs: [
          "Users must have legal capacity to contract and provide complete, accurate and current information. Login credentials are personal and must not be shared. CareBridge may request proof of identity, representation or authority to act for another person or organisation.",
        ],
      },
      {
        title: "4. Requests and bookings",
        paragraphs: [
          "Clients must accurately describe their needs, location, times, known risks, access conditions and information essential to safety. Availability and prices are shown before confirmation.",
          "A booking is confirmed only when the platform sends electronic confirmation and the payment or payment authorisation succeeds. CareBridge may reject or cancel requests that are unlawful, unsafe, discriminatory, impossible to fulfil or outside the stated scope.",
        ],
      },
      {
        title: "5. Urgent services and emergencies",
        paragraphs: [
          "CareBridge is not an emergency service and must not be used for urgent medical assistance. In an emergency, users must call 112 or the appropriate emergency service.",
        ],
      },
      {
        title: "6. Prices, payments and invoicing",
        paragraphs: [
          "The total price, the professional's gross remuneration, the platform fee, applicable taxes and charges will be shown before confirmation. CareBridge deducts a 17% platform fee from the professional's agreed gross remuneration. The client pays the total price shown before booking, and the professional sees the gross amount, CareBridge fee and expected net payout before accepting.",
          "Payments are processed by an external payment provider, including Stripe. CareBridge does not store complete card details. A professional payout is released only after service completion and confirmation, subject to the dispute, refund and fraud-prevention process.",
          "Invoices or receipts for the underlying service and platform fee will follow the tax model confirmed by the accountant and configured on the platform before launch.",
        ],
      },
      {
        title: "7. Cancellations, refunds and no-shows",
        paragraphs: [
          "The Cancellation and Refund Policy and the rules shown before booking apply: cancellation more than 24 hours in advance receives a full refund; cancellation between 2 and 24 hours may be charged at 50%; cancellation less than 2 hours in advance or client non-attendance may be charged in full. Exceptional circumstances will be reviewed individually. No policy limits mandatory consumer rights.",
          "Where a client expressly requests that a paid service start during a statutory withdrawal period, the client may owe a proportionate amount for services already provided. If the service is fully performed after the required prior consent and acknowledgement, the withdrawal right may end as provided by law.",
        ],
      },
      {
        title: "8. Conduct and safety",
        paragraphs: [
          "Users must treat others respectfully, provide a safe environment, follow reasonable safety instructions and not request unlawful work or work outside the professional's competence. Harassment, threats, discrimination, exploitation and attempts to bypass platform safeguards are prohibited.",
        ],
      },
      {
        title: "9. Reviews and content",
        paragraphs: [
          "Reviews must reflect genuine experiences and must not contain false, abusive, discriminatory, confidential or unlawful content. CareBridge may moderate content under the law and these Terms and will record decisions when required.",
        ],
      },
      {
        title: "10. Liability",
        paragraphs: [
          "Nothing in these Terms excludes liability that cannot lawfully be excluded. CareBridge remains responsible for its own acts and omissions under applicable law. It is not responsible for losses caused solely by false user information, an independent professional's breach or circumstances outside reasonable control, without limiting mandatory consumer rights.",
        ],
      },
      {
        title: "11. Complaints and disputes",
        paragraphs: [
          `Complaints may be sent to ${PT_EMAILS.support}. Before publication, CareBridge will provide access to the Portuguese Electronic Complaints Book and identify the competent consumer alternative dispute-resolution body.`,
        ],
      },
      {
        title: "12. Changes and termination",
        paragraphs: [
          "CareBridge may update these Terms for legal, technical, security or operational reasons. Material changes will be communicated with reasonable notice. Terms accepted when a booking was made continue to apply to that booking unless the law requires otherwise.",
        ],
      },
      {
        title: "13. Governing law",
        paragraphs: [
          "Portuguese law applies. Consumers retain all mandatory rights and may use the competent courts and legally available dispute-resolution procedures.",
        ],
      },
    ],
  },

  professionalTerms: {
    title: "Independent Professional Terms",
    sections: [
      {
        title: "1. Independent relationship",
        paragraphs: [
          "A professional uses the platform on their own account and, unless a different written agreement applies, acts as an independent service provider. These Terms do not create employment, partnership, general agency or exclusivity. Legal status depends on the reality of the relationship and mandatory law.",
        ],
      },
      {
        title: "2. Admission and verification",
        paragraphs: [
          "Activation requires registration, an onboarding assessment and administrative approval. Depending on the role, CareBridge may require proof of identity and the right to work in Portugal, a NIF, a NISS, proof of registration of professional activity with the Portuguese Tax Authority, a criminal-record certificate, qualifications, professional registration, applicable licences, insurance, references or a CV, and an IBAN.",
          "Requirements relating to professional bodies, the Portuguese Social Security Institute (ISS), childminder registration, overseas criminal records or additional documents apply only where relevant. CareBridge may verify information with competent bodies and request originals or updated documents.",
        ],
      },
      {
        title: "3. Assessment and account status",
        paragraphs: [
          "The onboarding assessment has an 80% pass mark and a maximum of three attempts unless communicated otherwise. It is a CareBridge onboarding assessment, not an accredited qualification, and does not replace legal credentials.",
          "A professional cannot accept work before approval. Missing, expired, suspicious or inconsistent documents may prevent approval or automatically suspend the account until resolved.",
        ],
      },
      {
        title: "4. Service delivery",
        paragraphs: [
          "Professionals must work within their competence, qualifications, insurance and legal authorisation; fulfil accepted bookings; keep appropriate records; protect confidentiality, dignity and consent; safeguard children and vulnerable adults; and report incidents, delay, risk or inability to attend.",
        ],
      },
      {
        title: "5. Prices, commission and payouts",
        paragraphs: [
          "Prices and remuneration are shown before a booking is accepted. CareBridge deducts a 17% platform fee from the professional's gross remuneration. Before accepting, the professional sees the gross amount, CareBridge fee and expected net payout.",
          "Payouts are processed through the platform's payment provider after service completion and confirmation, less amounts disclosed in advance and lawfully due. CareBridge may temporarily hold funds during a dispute, fraud concern, refund, chargeback or legal requirement.",
        ],
      },
      {
        title: "6. Cancellations and no-shows",
        paragraphs: [
          "Professionals must cancel only for justified reasons and give as much notice as possible. Late cancellation, non-attendance, repeated lateness or abandonment may lead to investigation, restricted access or suspension under the published policy and the principle of proportionality.",
        ],
      },
      {
        title: "7. Insurance, tax and social contributions",
        paragraphs: [
          "Professionals are responsible for maintaining required insurance, declaring income, issuing applicable tax documents and meeting obligations to the Tax Authority, Social Security, professional order or another competent body. CareBridge does not provide individual tax advice.",
        ],
      },
      {
        title: "8. Data protection and confidentiality",
        paragraphs: [
          "Professionals may access only information needed for the booking and use it solely to deliver the service. They must not copy, disclose or use it for personal purposes, marketing or off-platform contact without valid consent or legal obligation.",
        ],
      },
      {
        title: "9. Incidents, complaints and cooperation",
        paragraphs: [
          "Incidents involving safety, safeguarding, medication, accidents, data breaches or misconduct, as well as complaints, must be reported immediately through the designated channel. Professionals must cooperate with proportionate checks and preserve relevant evidence.",
        ],
      },
      {
        title: "10. Suspension and termination",
        paragraphs: [
          "CareBridge may suspend a profile as a precaution where there is serious risk, expired documentation, suspected fraud, a serious complaint or legal requirement. Where law and safety permit, the professional will be told the reason and may provide information or challenge the decision.",
        ],
      },
      {
        title: "11. Non-circumvention",
        paragraphs: [
          "A professional must not use information obtained through the platform to divert proposed or confirmed bookings to external payment for the purpose of avoiding the platform fee, where that restriction is included transparently, reasonably and lawfully in the approved final version.",
        ],
      },
      {
        title: "12. Law and disputes",
        paragraphs: [
          "Portuguese law applies. The parties should attempt to resolve complaints in good faith before using the competent courts, without limiting mandatory rights.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        title: "1. Controller",
        paragraphs: [
          `${PT_LEGAL_ENTITY}, Portuguese company number ${PT_NIPC}, is the controller for processing where it determines the purposes and means. Privacy contact: ${PT_EMAILS.privacy}. ${address ? `Geographic address: ${address}.` : "The geographic address will be inserted before publication."}`,
        ],
      },
      {
        title: "2. Data processed",
        bullets: [
          "Identity, contact, authentication and representative details.",
          "Professional profile, NIF, NISS, Portuguese tax activity, qualifications, registrations, insurance, references, CV, IBAN and verification status.",
          "Criminal-record and compliance documentation where legally necessary and proportionate.",
          "Booking, availability, service location, payment, refund, invoice, communications and support data.",
          "Information about care or health needs provided to arrange a service, which may include special-category data.",
          "Technical data, IP address, device information, cookies, security logs and audit records.",
        ],
      },
      {
        title: "3. Purposes and legal bases",
        paragraphs: [
          "We process data to create and administer accounts; verify professionals; arrange and perform bookings; process payments; provide support; prevent fraud and incidents; meet legal, tax and regulatory obligations; resolve complaints; improve the platform; and send marketing where consent or another valid basis applies.",
          "Legal bases may include pre-contractual steps and contract performance, legal obligation, assessed legitimate interests, consent, and the additional Article 9 GDPR conditions for special-category data. The exact basis for each processing activity must be validated before launch.",
        ],
      },
      {
        title: "4. Health data and vulnerable people",
        paragraphs: [
          "Only information strictly necessary to select and safely deliver a service is collected. Full clinical reports should not be uploaded where a limited description is enough. Access is restricted to authorised personnel and the relevant professional. Health information will be processed only where a valid Article 9 GDPR condition applies, including explicit consent where that is the applicable basis.",
          "For criminal-record information, CareBridge limits collection to roles where verification is legally necessary and proportionate. Wherever possible, it retains only the verification result, date and validity and deletes the full certificate once it is no longer necessary.",
        ],
      },
      {
        title: "5. Sources and sharing",
        paragraphs: [
          "Data may come from the individual, their representative, the booking organisation, the professional, verification bodies and systems used to provide the service.",
          "Necessary data may be shared with the corresponding client, organisation or professional; hosting, database, email, support, payment, fraud prevention, analytics and security suppliers; advisers; authorities; and regulators where a lawful basis exists.",
        ],
      },
      {
        title: "6. Processors and international transfers",
        paragraphs: [
          "CareBridge uses technology providers for hosting, databases, payment and email. The final list of providers, locations and international-transfer mechanisms must be documented before publication. Transfers outside the EEA will use adequacy decisions, standard contractual clauses or another lawful mechanism.",
        ],
      },
      {
        title: "7. Retention",
        paragraphs: [
          "Data is retained only for as long as necessary for its purpose and legal obligations. A retention schedule for accounts, compliance documents, bookings, payments, communications, incidents, audits and marketing must be approved before publication.",
        ],
      },
      {
        title: "8. Rights",
        paragraphs: [
          "Individuals may exercise their rights of access, rectification, erasure, restriction of processing, objection and portability, withdraw consent, and complain to the Portuguese Data Protection Authority (CNPD). Rights may be limited by legal obligations, third-party rights, security or the need to establish or defend legal claims.",
        ],
      },
      {
        title: "9. Automated decisions and AI",
        paragraphs: [
          "CareBridge should not make decisions producing significant legal effects solely through automated processing without a legal basis, appropriate information and safeguards. During the pilot, AI tools do not replace human review for approvals, suspensions or safety decisions.",
        ],
      },
      {
        title: "10. Security and incidents",
        paragraphs: [
          "CareBridge applies proportionate technical and organisational measures, including access controls, audit logs, appropriate encryption, backups and incident-response procedures. No system is entirely risk-free. Incidents will be assessed and reported where legally required.",
        ],
      },
      {
        title: "11. Contact and complaints",
        paragraphs: [
          `Privacy requests should be sent to ${PT_EMAILS.privacy}. Individuals may complain to the CNPD at www.cnpd.pt.`,
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    intro: [
      "CareBridge uses cookies and similar technologies for operation, security, preferences and, with consent where required, analytics and marketing.",
    ],
    sections: [
      {
        title: "Categories",
        bullets: [
          "Strictly necessary: authentication, security, session management and essential preferences.",
          "Preferences: language, region and saved choices.",
          "Analytics: measuring use and performance, enabled only as legally permitted.",
          "Marketing: advertising and campaign measurement, only after consent where required.",
        ],
        after: [
          "The cookie banner must make accepting, rejecting and managing categories equally easy. Non-essential cookies must not be set before a valid choice has been made. An up-to-date list of cookies, providers, purposes and durations must be generated from the actual site configuration before publication.",
        ],
      },
    ],
  },

  cancellation: {
    title: "Cancellation and Refund Policy",
    intro: [
      "This policy must be shown before each booking and configured consistently on the website, emails and Stripe.",
    ],
    sections: [
      {
        title: "Principles",
        bullets: [
          "Clients can cancel through their account or support and receive durable confirmation.",
          "Any charge must be proportionate, transparent and shown before booking.",
          "If the professional cancels, CareBridge will try to provide a replacement or refund the unperformed service.",
          "Approved refunds will be returned to the original payment method, subject to payment-provider processing times.",
          "Statutory consumer rights, including withdrawal where applicable, override the commercial policy.",
          "Disputes about completion, quality or safety will be reviewed before professional payout.",
        ],
      },
    ],
  },

  complaints: {
    title: "Complaints and Dispute Resolution",
    intro: [
      `Users may complain through ${PT_EMAILS.support}. CareBridge will acknowledge receipt and aim to respond within the applicable legal period.`,
      "Portuguese Electronic Complaints Book: www.livroreclamacoes.pt. A direct link must be displayed after the company completes registration with the service.",
      "Consumer alternative dispute resolution: the competent body or bodies for the activity and initial service area must be confirmed before publication. The notice must include their name, contact information and website. Consumers may also consult the Portuguese Directorate-General for Consumers at www.consumidor.gov.pt.",
    ],
    sections: [],
  },

  legalNotice: {
    title: "Legal Notice and Company Identification",
    intro: ["CareBridge does not provide emergency assistance. In an emergency, call 112."],
    sections: [],
    facts: [
      { label: "Operator", value: PT_LEGAL_ENTITY },
      { label: "Portuguese company number", value: PT_NIPC },
      {
        label: "Geographic address",
        value: address ?? "to be inserted before publication after legal confirmation and any registered-office change",
      },
      { label: "Telephone", value: PT_PHONE, href: `tel:${PT_PHONE.replace(/\s/g, "")}` },
      { label: "General email", value: PT_EMAILS.general, href: `mailto:${PT_EMAILS.general}` },
      { label: "Support", value: PT_EMAILS.support, href: `mailto:${PT_EMAILS.support}` },
      { label: "Privacy", value: PT_EMAILS.privacy, href: `mailto:${PT_EMAILS.privacy}` },
      { label: "Portuguese Electronic Complaints Book", value: "www.livroreclamacoes.pt", href: "https://www.livroreclamacoes.pt/" },
    ],
  },
};

export const PT_LEGAL_PACK: Record<LegalLang, Record<LegalDocKey, LegalDoc>> = { pt, en };

/** The legal index (/terms) in each language. */
export const PT_LEGAL_INDEX = {
  pt: {
    title: "Informação legal",
    intro:
      "Os documentos legais da CareBridge Connect Portugal. A versão portuguesa aplica-se aos utilizadores em Portugal; a versão inglesa é uma tradução de conveniência.",
    readDocument: "Ler documento",
    allDocuments: "Toda a informação legal",
  },
  en: {
    title: "Legal information",
    intro:
      "CareBridge Connect Portugal's legal documents. The Portuguese version governs users in Portugal; the English text is a convenience translation.",
    readDocument: "Read document",
    allDocuments: "All legal information",
  },
} as const;

/** One line under each document's title on the legal index. */
export const PT_LEGAL_SUMMARIES: Record<LegalLang, Record<LegalDocKey, string>> = {
  pt: {
    generalTerms: "Aplicam-se a clientes particulares, representantes, famílias e organizações.",
    professionalTerms: "Aplicam-se aos profissionais independentes registados na plataforma.",
    privacy: "Como tratamos os dados pessoais e como exercer os seus direitos.",
    cookies: "Os cookies e tecnologias semelhantes que o sítio utiliza.",
    cancellation: "Cancelamentos, reembolsos e não comparência.",
    complaints: "Como apresentar uma reclamação e resolver um litígio.",
    legalNotice: "A identificação da empresa que opera a plataforma.",
  },
  en: {
    generalTerms: "For individual clients, representatives, families and organisations.",
    professionalTerms: "For the independent professionals registered on the platform.",
    privacy: "How personal data is processed and how to exercise your rights.",
    cookies: "The cookies and similar technologies the site uses.",
    cancellation: "Cancellations, refunds and no-shows.",
    complaints: "How to complain and resolve a dispute.",
    legalNotice: "The identity of the company operating the platform.",
  },
};

/** `?lang=en` shows the convenience translation; anything else is Portuguese. */
export function legalLangFromParam(value: string | string[] | undefined): LegalLang {
  return (Array.isArray(value) ? value[0] : value) === "en" ? "en" : "pt";
}
