import { cookies } from "next/headers";
import { LOCALE_BY_COUNTRY, MARKET_COOKIE, parseSelectedMarket } from "@/lib/marketing/market";
import { dictionaryForLocale, type Dictionary } from "@/lib/i18n/dictionary";

/**
 * The visitor's dictionary: their market cookie decides the language, and an
 * unknown market falls back to English. Server components call this directly;
 * client components receive strings as props from them.
 */
export async function getDictionaryForVisitor(): Promise<Dictionary> {
  const store = await cookies();
  const country = parseSelectedMarket(store.get(MARKET_COOKIE)?.value);
  return dictionaryForLocale(LOCALE_BY_COUNTRY[country]);
}
