/**
 * Marketing dictionaries. English is the source of truth; Portuguese mirrors
 * its shape exactly, and a unit test fails if the two drift apart — so a new
 * string cannot silently render untranslated (Portugal Phase 2).
 *
 * Scope grows deliberately: only sections wired to the visitor's market belong
 * here. Role-specific content (NMC/Ofsted versus Ordens/ISS) is country data,
 * not translation, and follows later.
 */

import {
  ctaLabels,
  heroHeadline,
  heroSubheadline,
} from "@/data/marketing-copy";

export type MarketLocale = "en-GB" | "pt-PT";

export type Dictionary = {
  heroBadge: string;
  heroHeadline: string;
  heroSubheadline: string;
  /** Labels under the four stat figures, in display order. */
  statsBandLabels: [string, string, string, string];
  howItWorksHeading: string;
  howItWorksSubheading: string;
  onboardingSteps: { title: string; description: string }[];
  ctaKicker: string;
  ctaHeading: string;
  ctaBody: string;
  joinProfessional: string;
  createBookingRequest: string;
};

const en: Dictionary = {
  heroBadge: "Verified healthcare & childcare staffing",
  heroHeadline,
  heroSubheadline,
  statsBandLabels: [
    "Verified before first booking",
    "Professional roles",
    "Competency pass mark",
    "Full data export anytime",
  ],
  howItWorksHeading: "How it works",
  howItWorksSubheading:
    "From verification to payment — the full journey for professionals, families, private clients and organisations.",
  onboardingSteps: [
    {
      title: "Register & verify",
      description:
        "Every professional completes identity verification, professional registration checks against the regulator's own register, an online competency assessment and document uploads — all reviewed and approved by the CareBridge Connect team before they can be booked.",
    },
    {
      title: "Request or match",
      description:
        "Families, private clients and organisations request healthcare or childcare professionals by role, date, time and location. Verified professionals accept open bookings, or an administrator assigns one directly.",
    },
    {
      title: "Book with confidence",
      description:
        "Only fully verified professionals can accept bookings. Continuous compliance monitoring automatically restricts anyone whose registration or mandatory documents expire, until they are renewed and re-approved.",
    },
    {
      title: "Complete & get paid",
      description:
        "The professional logs the hours actually worked, the client or manager confirms them, and payment is released. Both sides keep a full booking history.",
    },
  ],
  ctaKicker: "Join the marketplace",
  ctaHeading: "Compliant staffing, ready when you need it",
  ctaBody:
    "Register as a verified professional, or create a booking request as a private client or organisation — with compliance, payments and audit trails built in.",
  joinProfessional: ctaLabels.joinProfessional,
  createBookingRequest: ctaLabels.createBookingRequest,
};

const pt: Dictionary = {
  heroBadge: "Cuidados de saúde e de infância verificados",
  heroHeadline:
    "A ligar Famílias e Organizações a Profissionais de Saúde e de Infância Verificados.",
  heroSubheadline:
    "Um marketplace de cuidados de confiança — enfermeiros, auxiliares de saúde, apoios domiciliários, fisioterapeutas, cuidadores infantis, babysitters e amas autorizadas, todos verificados, avaliados e sujeitos a monitorização contínua de conformidade.",
  statsBandLabels: [
    "Verificado antes da primeira marcação",
    "Funções profissionais",
    "Nota mínima de competência",
    "Exportação completa de dados em qualquer altura",
  ],
  howItWorksHeading: "Como funciona",
  howItWorksSubheading:
    "Da verificação ao pagamento — o percurso completo para profissionais, famílias, clientes particulares e organizações.",
  onboardingSteps: [
    {
      title: "Registar e verificar",
      description:
        "Todos os profissionais concluem a verificação de identidade, a verificação do registo profissional junto do próprio regulador, uma avaliação online de competências e o carregamento de documentos — tudo revisto e aprovado pela equipa CareBridge Connect antes de poderem ser reservados.",
    },
    {
      title: "Pedir ou associar",
      description:
        "Famílias, clientes particulares e organizações pedem profissionais de saúde ou de infância por função, data, hora e localização. Os profissionais verificados aceitam marcações abertas, ou um administrador atribui um diretamente.",
    },
    {
      title: "Marcar com confiança",
      description:
        "Só profissionais totalmente verificados podem aceitar marcações. A monitorização contínua de conformidade restringe automaticamente quem tiver registos ou documentos obrigatórios expirados, até estes serem renovados e reaprovados.",
    },
    {
      title: "Concluir e receber",
      description:
        "O profissional regista as horas efetivamente trabalhadas, o cliente ou gestor confirma-as e o pagamento é libertado. Ambas as partes mantêm um histórico completo das marcações.",
    },
  ],
  ctaKicker: "Junte-se ao marketplace",
  ctaHeading: "Pessoal conforme, pronto quando precisar",
  ctaBody:
    "Registe-se como profissional verificado, ou crie um pedido de marcação como cliente particular ou organização — com conformidade, pagamentos e trilhos de auditoria incluídos.",
  joinProfessional: "Junte-se como profissional",
  createBookingRequest: "Criar um pedido de marcação",
};

export const dictionaries: Record<MarketLocale, Dictionary> = {
  "en-GB": en,
  "pt-PT": pt,
};

/** A locale's dictionary, falling back to English for anything unknown. */
export function dictionaryForLocale(locale: string): Dictionary {
  return dictionaries[locale as MarketLocale] ?? dictionaries["en-GB"];
}
