import { faqs } from "@/data/faqs";
import { faqsPt } from "@/data/faqs-pt";
import { faqsPtEn } from "@/data/faqs-pt-en";

export type FaqEntry = { readonly question: string; readonly answer: string };

/** The FAQ in the visitor's language; anything but Portuguese reads the UK set. */
export function faqsForLocale(locale: string, country: "PT" | "GB" = "PT"): readonly FaqEntry[] {
  if (country === "PT" && locale !== "pt-PT") return faqsPtEn;
  return locale === "pt-PT" ? faqsPt : faqs;
}
