import { faqsForLocale } from "@/data/faqs-locale";
import type { AssistantLocale } from "@/lib/assistant/language";

export type KnowledgeEntry = { title: string; body: string };

/**
 * Everything the assistant may say. It is deliberately the site's own published
 * content — the FAQ plus a short platform guide — so an answer can never
 * promise something the platform does not do. Anything outside it is handed to
 * the team rather than improvised.
 */
const guideEn: KnowledgeEntry[] = [
  {
    title: "Which countries and languages does the platform serve?",
    body: "CareBridge Connect is preparing to launch first in Portugal. The United Kingdom is launching soon. Choose PT or EN independently of your market; language never changes local roles, compliance requirements or currency. Registration and bookings open only when enabled by the team.",
  },
  {
    title: "How do I register as a professional?",
    body: "Choose 'Join as a professional', create an account, pick your role (some professionals hold more than one), complete the eligibility screening, upload your documents and pass the online competency assessment. The CareBridge Connect team reviews everything before you can accept bookings.",
  },
  {
    title: "How do I request a booking as a client or organisation?",
    body: "Create a booking request from your dashboard: choose the role, date, time, duration and location. Verified professionals can accept it, or an administrator can assign one directly. You pay securely by card when the booking is confirmed.",
  },
  {
    title: "How do hours worked and payouts work?",
    body: "After a shift the professional logs the hours actually worked and the client or manager confirms them. If nobody responds within three working days the hours are confirmed automatically, unless the client has raised a query, in which case payout pauses until it is resolved. The professional is then paid out.",
  },
  {
    title: "Which currency is used?",
    body: "United Kingdom bookings are priced and paid in pounds sterling (GBP); Portuguese bookings are priced and paid in euro (EUR). The two are never mixed in one booking.",
  },
  {
    title: "How do I contact the team?",
    body: "Use the Contact page or email the address shown in the footer of the site. For anything about a specific booking, message through the booking itself.",
  },
];

const guidePt: KnowledgeEntry[] = [
  {
    title: "Que países e línguas serve a plataforma?",
    body: "A CareBridge Connect prepara o lançamento primeiro em Portugal. O Reino Unido estará disponível mais tarde. Escolha PT ou EN independentemente do mercado; o idioma não altera as categorias, os requisitos locais nem a moeda. O registo e as marcações só abrem quando forem ativados pela equipa.",
  },
  {
    title: "Como me registo como profissional?",
    body: "Escolha 'Registe-se como profissional', crie uma conta, indique a sua função (alguns profissionais têm mais do que uma), conclua a triagem de elegibilidade, envie os documentos e passe na avaliação de competências online. A equipa CareBridge Connect analisa tudo antes de poder aceitar marcações.",
  },
  {
    title: "Como peço uma marcação como cliente ou organização?",
    body: "Crie um pedido de marcação no seu painel: escolha a função, a data, o horário, a duração e o local. Os profissionais verificados podem aceitá-lo, ou um administrador pode atribuir um diretamente. O pagamento é feito de forma segura por cartão quando a marcação é confirmada.",
  },
  {
    title: "Como funcionam as horas trabalhadas e os pagamentos aos profissionais?",
    body: "Depois do serviço, o profissional regista as horas efetivamente trabalhadas e o cliente ou gestor confirma-as. Se ninguém responder em três dias úteis, as horas são confirmadas automaticamente, a não ser que o cliente tenha levantado uma dúvida — nesse caso o pagamento fica em pausa até ser resolvida. Só depois o profissional recebe.",
  },
  {
    title: "Que moeda é utilizada?",
    body: "As marcações no Reino Unido são preçadas e pagas em libras (GBP); as marcações em Portugal são preçadas e pagas em euros (EUR). As duas moedas nunca se misturam na mesma marcação.",
  },
  {
    title: "Como contacto a equipa?",
    body: "Use a página de Contacto ou escreva para o email indicado no rodapé do site. Para questões sobre uma marcação concreta, use as mensagens dessa marcação.",
  },
];

export function knowledgeFor(locale: AssistantLocale): KnowledgeEntry[] {
  const faq = faqsForLocale(locale).map((f) => ({ title: f.question, body: f.answer }));
  return [...(locale === "pt-PT" ? guidePt : guideEn), ...faq];
}
