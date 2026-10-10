import { LOCALE_BY_COUNTRY } from "@/lib/marketing/market";
import { getAccountCountry } from "@/lib/accounts/market-server";
import { makeT, type PortalLocale, type T } from "@/lib/i18n/portal";

/** The language of the signed-in app follows the account's persisted market. */
export async function getPortalLocale(): Promise<PortalLocale> {
  return LOCALE_BY_COUNTRY[await getAccountCountry()] as PortalLocale;
}

/** `t` for server components. */
export async function getPortalT(): Promise<T> {
  return makeT(await getPortalLocale());
}
