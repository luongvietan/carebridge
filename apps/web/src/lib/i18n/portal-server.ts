import { getPreferredLocale } from "./preference-server";
import { makeT, type T, type PortalLocale } from "@/lib/i18n/portal";

/** Language is independent of the account's regulatory market. */
export async function getPortalLocale(): Promise<PortalLocale> {
  return getPreferredLocale();
}

/** `t` for server components. */
export async function getPortalT(): Promise<T> {
  return makeT(await getPortalLocale());
}
