"use client";

import { createContext, useContext, type ReactNode } from "react";
import { authCopy, type AuthCopy, type AuthLocale } from "@/lib/auth/copy";

const AuthLocaleContext = createContext<AuthLocale>("en-GB");

/**
 * The sign-in and registration pages are client components, so the server layout
 * hands them the visitor's market language through this provider instead of
 * every page reading cookies itself.
 */
export function AuthLocaleProvider({ locale, children }: { locale: AuthLocale; children: ReactNode }) {
  return <AuthLocaleContext.Provider value={locale}>{children}</AuthLocaleContext.Provider>;
}

export function useAuthCopy(): AuthCopy {
  return authCopy[useContext(AuthLocaleContext)];
}
