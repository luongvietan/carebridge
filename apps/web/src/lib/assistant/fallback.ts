import { knowledgeFor, type KnowledgeEntry } from "@/lib/assistant/knowledge";
import type { AssistantLocale } from "@/lib/assistant/language";

const STOP = new Set([
  "the", "a", "an", "of", "in", "on", "to", "for", "with", "how", "what", "when", "do",
  "does", "is", "are", "i", "we", "you", "my", "and", "or", "it", "can", "be", "have",
  "o", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "em", "no", "na", "que",
  "para", "por", "com", "como", "e", "ou", "qual", "quais", "posso", "pode", "podem",
  "quero", "preciso",
]);

const strip = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** A crude shared stem: "pagamento"/"pagamentos", "booking"/"bookings" meet at five letters. */
const stem = (w: string) => (w.length > 5 ? w.slice(0, 5) : w);

function tokens(text: string): string[] {
  return (strip(text).match(/[a-z0-9]+/g) ?? [])
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
}

const CONTACT: Record<AssistantLocale, string> = {
  "en-GB":
    "I'm not sure about that one. Please use our Contact page and the team will get back to you.",
  "pt-PT":
    "Não tenho a certeza sobre isso. Use por favor a nossa página de Contacto e a equipa responderá.",
};

/**
 * Used when no language model is configured or it is unreachable: the entry
 * whose words overlap the question most (title counts double). Below a minimum
 * overlap it declines and points to the team, rather than guess.
 */
export function answerFromKnowledge(
  question: string,
  locale: AssistantLocale,
  entries: KnowledgeEntry[] = knowledgeFor(locale),
): { answer: string; matched: boolean } {
  const q = new Set(tokens(question));
  let best: { score: number; entry: KnowledgeEntry } | null = null;
  for (const entry of entries) {
    const title = new Set(tokens(entry.title));
    const body = new Set(tokens(entry.body));
    let score = 0;
    for (const w of q) score += (title.has(w) ? 2 : 0) + (body.has(w) ? 1 : 0);
    if (!best || score > best.score) best = { score, entry };
  }
  if (!best || best.score < 2) return { answer: CONTACT[locale], matched: false };
  return { answer: best.entry.body, matched: true };
}
