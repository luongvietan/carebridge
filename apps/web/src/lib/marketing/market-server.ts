import { cookies } from "next/headers";
import { isGateEnabled } from "@/lib/auth/gate";
import { createClient } from "@/lib/supabase/server";
import { MARKET_COOKIE, parseSelectedMarket, type MarketCountry } from "@/lib/marketing/market";

/** A market as shown on the homepage, straight from `countries` (0076). */
export type Market = {
  code: string;
  name: string;
  flag: string;
  locale: string;
  currency: string;
  live: boolean;
  /**
   * Not live yet, but open to the people looking at the private preview. While
   * the site sits behind its access gate, anyone in it is a reviewer (the client
   * checking the Portuguese side); once the gate lifts, only `live` counts.
   */
  preview: boolean;
};

const FLAG_BY_COUNTRY: Record<string, string> = {
  GB: "\u{1F1EC}\u{1F1E7}",
  PT: "\u{1F1F5}\u{1F1F9}",
};

/** Every market the platform knows about, in display order. */
export async function listMarkets(): Promise<Market[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("countries")
    .select("code, name, currency, locale, is_live")
    .order("sort_order");
  return (data ?? []).map((c) => ({
    code: c.code,
    name: c.name,
    currency: c.currency,
    locale: c.locale,
    live: c.is_live,
    preview: !c.is_live && isGateEnabled(),
    flag: FLAG_BY_COUNTRY[c.code] ?? "",
  }));
}

/**
 * The visitor's chosen market, defaulting to the home market. The cookie only
 * ever names a market; whether that choice is honoured for content is decided
 * against `countries.is_live` at the places that use it.
 */
export async function getSelectedCountry(): Promise<MarketCountry> {
  const store = await cookies();
  const chosen = parseSelectedMarket(store.get(MARKET_COOKIE)?.value);
  if (chosen === "GB" || isGateEnabled()) return chosen;

  // Public site: a market that is not live cannot be shown, even to a visitor
  // whose cookie still names it (set during the private preview).
  const supabase = await createClient();
  const { data } = await supabase.from("countries").select("is_live").eq("code", chosen).maybeSingle();
  return data?.is_live ? chosen : "GB";
}
