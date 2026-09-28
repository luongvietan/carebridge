import type { ReactNode } from "react";
import { LOCALE_BY_COUNTRY } from "@/lib/marketing/market";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import { AuthLocaleProvider } from "@/components/auth-locale";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const locale = LOCALE_BY_COUNTRY[await getSelectedCountry()] as "en-GB" | "pt-PT";
  return (
    <AuthLocaleProvider locale={locale}>
      <SiteNav />
      {children}
      <SiteFooter />
    </AuthLocaleProvider>
  );
}
