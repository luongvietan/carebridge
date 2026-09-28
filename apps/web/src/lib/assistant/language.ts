/**
 * Which language a visitor is writing in. The assistant answers in it, whatever
 * market the visitor browsed from — a Portuguese speaker on the UK site (or the
 * reverse) still gets the language they typed. Only two languages exist today,
 * so a stop-word tally is enough and needs no model call.
 */

export type AssistantLocale = "en-GB" | "pt-PT";

const PT_WORDS = new Set([
  "o", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "em", "no", "na", "nos",
  "nas", "que", "para", "por", "com", "como", "não", "nao", "sim", "é", "são", "sou",
  "estou", "está", "quero", "preciso", "posso", "pode", "podem", "qual", "quais",
  "quando", "onde", "quanto", "obrigado", "obrigada", "olá", "ola", "bom", "boa",
  "dia", "marcação", "marcações", "profissional", "profissionais", "pagamento",
  "pagamentos", "registo", "cuidados", "preço", "preços", "horas", "conta", "ajuda",
  "meu", "minha", "vocês", "voces", "se", "ao", "à", "aos", "mais", "também", "tambem",
]);

const EN_WORDS = new Set([
  "the", "a", "an", "of", "in", "on", "to", "for", "with", "how", "what", "when",
  "where", "which", "who", "can", "do", "does", "is", "are", "am", "i", "we", "you",
  "my", "our", "your", "hello", "hi", "thanks", "thank", "please", "book", "booking",
  "bookings", "payment", "payments", "register", "price", "prices", "hours", "account",
  "help", "need", "want", "would", "and", "or", "it", "this", "that", "be", "have",
]);

const PT_DIACRITICS = /[ãõçáàâéêíóôú]/gi;

export function detectLocale(text: string, fallback: AssistantLocale): AssistantLocale {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  let pt = (text.match(PT_DIACRITICS) ?? []).length;
  let en = 0;
  for (const w of words) {
    if (PT_WORDS.has(w)) pt++;
    if (EN_WORDS.has(w)) en++;
  }
  if (pt === en) return fallback;
  return pt > en ? "pt-PT" : "en-GB";
}
