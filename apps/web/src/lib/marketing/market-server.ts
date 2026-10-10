import { cookies } from "next/headers";
import { isGateEnabled } from "@/lib/auth/gate";
import { createClient } from "@/lib/supabase/server";
import { MARKET_COOKIE, parseSelectedMarket, isMarketOpen, type MarketCountry } from "@/lib/marketing/market";

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
    live: isMarketOpen(c.code, c.is_live, false),
    preview: !c.is_live && isMarketOpen(c.code, false, isGateEnabled()),
    flag: FLAG_BY_COUNTRY[c.code] ?? "",
  }));
}

/**
 * Portugal-first marketing, including visitors with a legacy UK cookie.
 * Public content can describe a market before registration and bookings open.
 */
export async function getSelectedCountry(): Promise<MarketCountry> {
  const store = await cookies();
  const chosen = parseSelectedMarket(store.get(MARKET_COOKIE)?.value);
  // Marketing can describe Portugal before launch, without opening registration.
  return chosen === "GB" ? "PT" : chosen;
}

export async function isRegistrationOpen(country: MarketCountry): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("countries").select("is_live").eq("code", country).maybeSingle();
  return !!data && isMarketOpen(country, data.is_live, isGateEnabled());
}
