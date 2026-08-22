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

/** Anything unrecognised — absent, tampered, stale — falls back to the UK. */
export function parseSelectedMarket(value: string | null | undefined): MarketCountry {
  return KNOWN.includes((value ?? "") as MarketCountry) ? ((value ?? "") as MarketCountry) : "GB";
}

export function localeForCountry(country: MarketCountry): string {
  return LOCALE_BY_COUNTRY[country];
}
