import { LOCALE_BY_COUNTRY } from "@/lib/marketing/market";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import { makeT, type PortalLocale, type T } from "@/lib/i18n/portal";

/** The language of the signed-in app for this request: the market being used. */
export async function getPortalLocale(): Promise<PortalLocale> {
  return LOCALE_BY_COUNTRY[await getSelectedCountry()] as PortalLocale;
}

/** `t` for server components. */
export async function getPortalT(): Promise<T> {
  return makeT(await getPortalLocale());
}
