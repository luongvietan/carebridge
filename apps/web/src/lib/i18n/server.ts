import { getPreferredLocale } from "./preference-server";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import { contentForLocale, type MarketingContent } from "@/lib/i18n/content";
import { dictionaryForLocale, type Dictionary } from "@/lib/i18n/dictionary";

/**
 * The visitor's dictionary: their market cookie decides the language, and an
 * unknown market falls back to English. Server components call this directly;
 * client components receive strings as props from them.
 */
export async function getDictionaryForVisitor(): Promise<Dictionary> {
  const country = await getSelectedCountry();
  return dictionaryForLocale(await getPreferredLocale(), country);
}

/**
 * The visitor's marketing content — roles, compliance copy, headings — for the
 * market they chose. Same rule as the dictionary: unknown market, English.
 */
export async function getContentForVisitor(): Promise<MarketingContent> {
  const country = await getSelectedCountry();
  return contentForLocale(await getPreferredLocale(), country);
}
