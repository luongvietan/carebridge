/**
 * Money rendering. Every amount is displayed in the currency it was charged
 * in — a euro figure must never quietly render as pounds (Portugal Phase 2),
 * so callers pass the currency that owns the amount alongside the number.
 *
 * GBP renders en-GB and EUR renders pt-PT, matching each market's conventions.
 */

const LOCALE_BY_CURRENCY: Record<string, string> = {
  GBP: "en-GB",
  EUR: "pt-PT",
};

/** Symbols for form labels, where Intl's full formatting is too heavy. */
const SYMBOL_BY_CURRENCY: Record<string, string> = {
  GBP: "£",
  EUR: "€",
};

export function currencySymbol(currency: string): string {
  return SYMBOL_BY_CURRENCY[currency] ?? `${currency} `;
}

function isKnownCurrency(currency: string): boolean {
  return Object.prototype.hasOwnProperty.call(LOCALE_BY_CURRENCY, currency);
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();
const rateFormatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, forceTwoDecimals: boolean): Intl.NumberFormat {
  const cache = forceTwoDecimals ? rateFormatters : moneyFormatters;
  const cached = cache.get(currency);
  if (cached) return cached;
  const created = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? "en-GB", {
    style: "currency",
    currency,
    ...(forceTwoDecimals ? { minimumFractionDigits: 2 } : {}),
  });
  cache.set(currency, created);
  return created;
}

/**
 * An amount in its own currency; an em dash for absent values, matching
 * formatGbpMoney's convention across the tables.
 */
export function formatMoney(amount: number | null | undefined, currency = "GBP"): string {
  if (amount == null) return "—";
  if (!isKnownCurrency(currency)) return `${currency} ${Number(amount).toFixed(2)}`;
  return formatter(currency, false).format(Number(amount));
}

/** A hourly rate, always shown to two decimals. */
export function formatRate(amount: number, currency = "GBP"): string {
  if (!isKnownCurrency(currency)) return `${currency} ${Number(amount).toFixed(2)}`;
  return formatter(currency, true).format(Number(amount));
}

export function formatGbpMoney(amount: number | null | undefined): string {
  return formatMoney(amount, "GBP");
}

/**
 * "£1,234 · €456" — one figure per currency present, never a cross-currency
 * sum. With nothing recorded it renders £0, so an empty state reads as before.
 */
export function formatAmountsByCurrency(byCurrency: Record<string, number>): string {
  const entries = Object.entries(byCurrency).filter(([, value]) => value !== 0);
  if (entries.length === 0) return formatter("GBP", false).format(0);
  return entries.map(([currency, value]) => formatMoney(value, currency)).join(" · ");
}
