export type PreferredLocale = "pt-PT" | "en-GB";
export const LOCALE_COOKIE = "cbc_locale";
export function isPreferredLocale(value: unknown): value is PreferredLocale { return value === "pt-PT" || value === "en-GB"; }
export function resolveLocale(cookie: unknown, saved?: unknown): PreferredLocale {
  return isPreferredLocale(cookie) ? cookie : isPreferredLocale(saved) ? saved : "pt-PT";
}
