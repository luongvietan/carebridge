/**
 * Market selection rules — pure, so the cookie parsing behind the country
 * switch is testable without a request. The DB (`countries`, migration 0076)
 * owns which markets exist and whether they are live; this only owns how a
 * visitor's choice is stored and read.
 */

export const MARKET_COOKIE = "cbc_market";

export type MarketCountry = "GB" | "PT";

const KNOWN: readonly MarketCountry[] = ["GB", "PT"];

export const LOCALE_BY_COUNTRY: Record<MarketCountry, string> = {
  GB: "en-GB",
  PT: "pt-PT",
};

/** Portugal is the initial launch market. Legacy UK account values remain valid. */
export function parseSelectedMarket(value: string | null | undefined): MarketCountry {
  return KNOWN.includes((value ?? "") as MarketCountry) ? ((value ?? "") as MarketCountry) : "PT";
}

/** UK onboarding stays closed; preview access does not override that policy. */
export function isMarketOpen(code: string, live: boolean, preview: boolean): boolean {
  return code === "PT" && (live || preview);
}

export function localeForCountry(country: MarketCountry): string {
  return LOCALE_BY_COUNTRY[country];
}
