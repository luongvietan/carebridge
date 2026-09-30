"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type PortalLocale, type T } from "@/lib/i18n/portal";

const PortalLocaleContext = createContext<PortalLocale>("en-GB");

/** Hands the server's chosen language to the signed-in app's client components. */
export function PortalLocaleProvider({ locale, children }: { locale: PortalLocale; children: ReactNode }) {
  return <PortalLocaleContext.Provider value={locale}>{children}</PortalLocaleContext.Provider>;
}

export function usePortalLocale(): PortalLocale {
  return useContext(PortalLocaleContext);
}

/** `t` for client components. */
export function usePortalT(): T {
  const locale = useContext(PortalLocaleContext);
  return useMemo(() => makeT(locale), [locale]);
}

/** Translates a message that arrives as data (a server error, a status). */
export function Tr({ children }: { children: string }) {
  return <>{usePortalT()(children)}</>;
}
