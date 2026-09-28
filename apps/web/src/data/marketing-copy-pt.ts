/**
 * European Portuguese marketing content for the Portuguese market. This is
 * country content, not a translation of the UK's: the roles are the eight in
 * migration 0077 (Ordem dos Enfermeiros, Ordem dos Fisioterapeutas, Segurança
 * Social) and no regulatory status is claimed beyond what the platform itself
 * checks. Legal documents (terms, privacy) are deliberately NOT here — they
 * need a lawyer's Portuguese, not ours.
 */
import type { RoleCopy } from "@/lib/i18n/content";

export const professionalRolesPt: RoleCopy[] = [
  {
    title: "Enfermeiros/as — Adultos",
    featuredOnHome: true,
    image: { set: "health", index: 0 },
    description:
      "Enfermeiros/as com cédula profissional válida na Ordem dos Enfermeiros, que prestam cuidados clínicos, gestão da medicação e avaliações dentro do seu âmbito de prática, sujeitos a verificação e aos requisitos de conformidade.",
  },
  {
    title: "Enfermeiros/as — Pediatria",
    image: { set: "health", index: 1 },
    description:
      "Enfermeiros/as de pediatria com cédula profissional válida, que cuidam de bebés, crianças e jovens, com avaliação pediátrica e encaminhamento dentro do seu âmbito de prática.",
  },
  {
    title: "Enfermeiros/as — Saúde Mental",
    image: { set: "health", index: 2 },
    description:
      "Enfermeiros/as de saúde mental com cédula profissional válida, que apoiam pessoas em sofrimento psíquico, com avaliação de risco, desescalada e cuidados centrados na recuperação, dentro do seu âmbito de prática.",
  },
  {
    title: "Fisioterapeutas",
    image: { set: "health", index: 5 },
    description:
      "Fisioterapeutas com inscrição válida na Ordem dos Fisioterapeutas, para programas de reabilitação e mobilidade dentro do seu âmbito de prática.",
  },
  {
    title: "Auxiliares de Saúde / Apoio Domiciliário",
    featuredOnHome: true,
    image: { set: "health", index: 3 },
    description:
      "Profissionais com experiência em companhia, apoio ao bem-estar, acompanhamento a consultas e à comunidade, apoio noturno e outras atividades de apoio não reguladas.",
  },
];

export const childcareRolesPt: RoleCopy[] = [
  {
    title: "Cuidadores/as Infantis ao Domicílio",
    featuredOnHome: true,
    image: { set: "child", index: 0 },
    description:
      "Profissionais que cuidam de crianças em casa da família, a tempo inteiro, a tempo parcial ou durante a noite. O registo criminal para funções com menores e o certificado de primeiros socorros são verificados antes de qualquer marcação.",
  },
  {
    title: "Babysitters",
    image: { set: "child", index: 2 },
    description:
      "Babysitters com experiência para cuidados ao final do dia, ocasionais e de curto aviso, com registo criminal para funções com menores e formação em primeiros socorros.",
  },
  {
    title: "Amas Autorizadas",
    image: { set: "child", index: 1 },
    description:
      "Amas que cuidam de crianças na sua própria casa, com a autorização da Segurança Social (ISS). O número de autorização é obrigatório e é verificado antes de qualquer marcação.",
  },
];

export const childcareCareTypesPt = [
  "Tempo inteiro",
  "Tempo parcial",
  "Apoio após a escola",
  "Durante a noite",
  "Cuidados nas férias",
  "Cuidados de emergência",
] as const;

export const supportedServicesPt = [
  "Companhia",
  "Acompanhamento à comunidade",
  "Apoio em consultas",
  "Apoio ao bem-estar",
  "Serviços de descanso do cuidador",
  "Apoio após alta hospitalar",
  "Acompanhamento",
  "Apoio noturno",
] as const;

export const complianceFeaturesPt = [
  {
    title: "Porque é que os clientes confiam em nós",
    bullets: [
      "Todos os profissionais passam pela triagem de elegibilidade, pela avaliação de competências e pela verificação de documentos antes de serem aprovados.",
      "A inscrição profissional é verificada junto da entidade competente — a Ordem dos Enfermeiros, a Ordem dos Fisioterapeutas ou, no caso das amas, a Segurança Social — e é reverificada todos os anos.",
    ],
  },
  {
    title: "Programas de apoio à medida",
    bullets: [
      "Pedidos de marcação combinados entre oito funções — enfermeiros/as de adultos, de pediatria e de saúde mental, fisioterapeutas, auxiliares de saúde, cuidadores infantis ao domicílio, babysitters e amas autorizadas.",
      "Cobertura flexível para famílias, clientes particulares e organizações de saúde e de apoio social.",
    ],
  },
  {
    title: "Bloqueio automático por incumprimento",
    bullets: [
      "Um registo criminal, cédula profissional, seguro, formação ou autorização de residência caducados restringem de imediato novas marcações.",
      "Os profissionais voltam a ficar disponíveis apenas depois de os documentos atualizados serem enviados e aprovados.",
    ],
  },
] as const;

export const verificationChecklistPt = [
  "Cédula profissional ou inscrição na ordem competente",
  "Direito de residência e de trabalho",
  "Verificação de identidade",
  "Comprovativo de morada e NIF",
  "Certificado de registo criminal (com o específico para menores nas funções de infância)",
  "Formação obrigatória",
  "Referências",
  "Monitorização contínua com alertas automáticos de caducidade",
] as const;

export const aboutFeaturesPt = [
  "Profissionais com conformidade verificada em todas as marcações",
  "Acompanhamento contínuo das credenciais, com restrição automática",
  "Exportação completa dos dados da plataforma em CSV ou Excel a qualquer momento",
] as const;

export const statsPt = [
  { value: "100%", label: "Verificados antes da primeira marcação" },
  { value: "8", label: "Funções profissionais" },
  { value: "80%", label: "Nota mínima na avaliação de competências" },
  { value: "CSV / XLSX", label: "Exportação completa dos dados a qualquer momento" },
] as const;

export const regulatoryDisclaimerPt =
  "A CareBridge Connect é um marketplace que liga clientes e organizações a profissionais independentes. Não presta diretamente cuidados de saúde regulados, serviços de enfermagem, tratamentos ou cuidados: quem presta o serviço é o profissional que aceita a marcação.";

export const emergencyDisclaimerPt =
  "A CareBridge Connect não é um serviço de emergência médica. Em caso de emergência, ligue 112 ou dirija-se ao serviço de urgência mais próximo.";

export const importantInformationPt = {
  heading: "Informação importante",
  intro:
    "A CareBridge Connect é um marketplace que liga clientes e organizações a profissionais independentes de saúde e de cuidados infantis.",
  paragraphs: [
    "A CareBridge Connect não presta diretamente cuidados de saúde regulados, serviços de enfermagem, tratamentos ou cuidados. Facilita apresentações e marcações entre clientes e profissionais independentes, que trabalham na sua própria capacidade profissional.",
    "Os auxiliares de saúde prestam companhia, apoio ao bem-estar, acompanhamento a consultas e à comunidade, apoio noturno e outras atividades de apoio não reguladas.",
    "Os enfermeiros e outros profissionais devidamente qualificados podem prestar serviços que se enquadrem no seu âmbito de prática profissional, sujeitos a verificação e aos requisitos de conformidade.",
    "Todos os profissionais são responsáveis por trabalhar dentro da sua formação, competência, normas profissionais e âmbito de prática.",
    "Sempre que sejam necessários cuidados regulados, os clientes devem procurar apoio junto de um prestador devidamente licenciado.",
  ],
  audienceLabel:
    "A plataforma serve sobretudo famílias, clientes particulares e organizações que procuram profissionais de saúde e de cuidados infantis verificados.",
} as const;

export const aboutContentPt = {
  welcome: {
    heading: "Bem-vindo à CareBridge Connect",
    paragraphs: [
      "A CareBridge Connect é um marketplace de saúde e de cuidados infantis que liga famílias, clientes particulares e organizações a profissionais de confiança em Portugal e no Reino Unido.",
      "A nossa plataforma pretende tornar o apoio mais acessível, criando uma forma simples, transparente e eficiente de clientes e organizações encontrarem profissionais qualificados.",
      "Quer procure companhia, apoio ao bem-estar, apoio após alta hospitalar, apoio noturno, cuidados infantis ao domicílio ou reforço de equipas de saúde, a CareBridge Connect ajuda a juntar as pessoas certas.",
    ],
  },
  mission: {
    heading: "A nossa missão",
    text: "Melhorar o acesso ao apoio em saúde e em cuidados infantis, ligando pessoas, famílias e organizações a profissionais de confiança através de uma plataforma segura, inovadora e fácil de usar.",
  },
  vision: {
    heading: "A nossa visão",
    text: "Tornarmo-nos um marketplace de referência que dá aos profissionais oportunidades de trabalho flexíveis e ajuda as comunidades a aceder ao apoio de que precisam, quando precisam.",
  },
  commitment: {
    heading: "O nosso compromisso",
    intro: "Na CareBridge Connect, comprometemo-nos a:",
    bullets: [
      "Promover o profissionalismo, a integridade e a responsabilização",
      "Criar uma plataforma segura e transparente para clientes e profissionais",
      "Apoiar os profissionais com oportunidades de trabalho flexíveis",
      "Ajudar pessoas, famílias e organizações a aceder a apoio fiável",
      "Construir relações de confiança dentro das comunidades locais",
      "Melhorar continuamente a forma como o apoio é procurado e prestado",
    ],
  },
  verification: {
    heading: "Verificação dos profissionais",
    intro:
      "Para promover a segurança e a confiança, os profissionais que se juntam à plataforma passam por um processo de verificação que pode incluir:",
    bullets: [
      "Verificação de identidade",
      "Direito de residência e de trabalho",
      "Certificado de registo criminal (e o específico para menores, nas funções de infância)",
      "Cédula profissional ou inscrição na ordem competente, quando aplicável",
      "Autorização da Segurança Social (ISS), no caso das amas",
      "Verificação de qualificações e de referências",
      "Formação obrigatória em dia",
    ],
  },
} as const;

/** Strings around the content: navigation, footer, headings, calls to action. */
export const uiPt = {
  nav: {
    home: "Início",
    about: "Sobre nós",
    roles: "Funções profissionais",
    faq: "Perguntas frequentes",
    contactUs: "Contacte-nos",
    signIn: "Entrar",
    dashboard: "Painel",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  footer: {
    contactTitle: "Contacte-nos",
    socialTitle: "As nossas redes sociais",
    socialBody:
      "As novidades, os recursos, as opiniões de especialistas e as notícias da CareBridge Connect.",
    terms: "Termos e condições",
    importantInfo: "Informação importante",
    privacy: "Política de privacidade",
    home: "Início",
    services: "Funções",
    faq: "Perguntas frequentes",
    support: "Apoio",
    backToTop: "Voltar ao topo",
    rights: "Todos os direitos reservados.",
  },
  hero: { complianceBuiltIn: "Conformidade integrada", verifiedRoles: "8 tipos de funções verificadas" },
  statsFootnote:
    "Pensada para o controlo operacional — registos de auditoria completos, alertas automáticos de conformidade e exportação de dados para a CareBridge Connect a qualquer momento.",
  getStarted: "Começar",
  aboutIntro: {
    heading:
      "Um marketplace seguro de saúde e de cuidados infantis — só profissionais adequados e verificados se juntam à nossa plataforma",
    badge: "Conformidade em primeiro lugar",
    body: "A CareBridge Connect oferece um percurso de integração seguro e conforme para os profissionais e um processo de marcação simples para clientes particulares e organizações — com triagem de elegibilidade, avaliação de competências, verificação de documentos e acompanhamento contínuo da conformidade.",
  },
  servicesOffer: {
    heading: "Funções profissionais que cobrimos",
    sub: "Profissionais de saúde e de cuidados infantis — de enfermeiros e auxiliares de saúde a cuidadores infantis e amas — disponíveis para pedidos de marcação de famílias e organizações.",
    more: "Os/as enfermeiros/as de pediatria e de saúde mental, fisioterapeutas, babysitters e amas autorizadas também estão disponíveis.",
    viewAll: "Ver todas as oito funções",
  },
  compliance: {
    heading: "Profissionais verificados, conformidade contínua",
    body: "Nenhum profissional — de saúde ou de cuidados infantis — pode aceitar uma marcação enquanto tudo isto não for verificado e aprovado, e cada item é monitorizado quanto à caducidade depois disso.",
  },
  callout: { readFull: "Ler toda a informação importante e o aviso legal" },
  servicesPage: {
    title: "Funções profissionais que cobrimos",
    badge: "Funções profissionais",
    description:
      "Apoio de saúde e de cuidados infantis com conformidade verificada, para famílias e organizações — profissionais verificados em oito funções, combinados através de pedidos de marcação.",
    healthHeading: "Profissionais de saúde",
    healthSub:
      "Enfermeiros/as, fisioterapeutas e auxiliares de saúde — cada um verificado antes da primeira marcação.",
    childHeading: "Profissionais de cuidados infantis",
    childSub:
      "Os cuidadores infantis e os babysitters são verificados com o registo criminal para funções com menores e o certificado de primeiros socorros; as amas têm de ter a autorização da Segurança Social (ISS), verificada antes de qualquer marcação.",
    careTypesHeading: "Opções de marcação de cuidados infantis",
    careTypesSub: "Escolha o formato que melhor se adapta à sua família ao fazer um pedido de marcação.",
    servicesHeading: "Serviços que apoiamos",
    servicesSub:
      "As marcações limitam-se a companhia e a outras atividades não reguladas. A CareBridge Connect não presta cuidados pessoais regulados.",
    andOthers: "…e outras atividades não reguladas.",
    howHeading: "Como funciona",
    howSub:
      "Da integração à marcação — um caminho claro para profissionais, clientes particulares e organizações.",
    readyHeading: "Pronto para criar um pedido de marcação?",
    readyBody:
      "Registe-se como cliente particular ou organização — ou junte-se como profissional verificado.",
  },
  aboutPage: {
    badge: "Sobre a CareBridge Connect",
    title: "Bem-vindo à CareBridge Connect",
    description:
      "Um marketplace que liga famílias, clientes particulares e organizações a profissionais de confiança em Portugal e no Reino Unido.",
    readDisclaimer: "Ler o aviso legal completo",
  },
  contact: {
    title: "Teremos todo o gosto em ouvi-lo",
    description:
      "Dúvidas sobre como se juntar como profissional, criar um pedido de marcação ou sobre a conformidade? Envie-nos uma mensagem e responderemos.",
    email: "Email",
    phone: "Telefone",
    address: "Morada",
    joinTitle: "Quer juntar-se?",
    joinBody:
      "Os profissionais concluem a integração online. Os clientes e as organizações podem registar-se e criar pedidos de marcação diretamente — sem precisar de nos contactar primeiro.",
  },
  contactForm: {
    thanksTitle: "Obrigado — a sua mensagem está a caminho",
    thanksBody: "Recebemos a sua mensagem e responderemos por email em breve.",
    name: "Nome completo",
    namePlaceholder: "O seu nome",
    email: "Email",
    subject: "Assunto",
    subjectPlaceholder: "Como podemos ajudar?",
    message: "Mensagem",
    messagePlaceholder: "Conte-nos um pouco mais…",
    send: "Enviar mensagem",
    sending: "A enviar…",
  },
} as const;
