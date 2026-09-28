import { faqs } from "@/data/faqs";
import { faqsPt } from "@/data/faqs-pt";

export type FaqEntry = { readonly question: string; readonly answer: string };

/** The FAQ in the visitor's language; anything but Portuguese reads the UK set. */
export function faqsForLocale(locale: string): readonly FaqEntry[] {
  return locale === "pt-PT" ? faqsPt : faqs;
}
