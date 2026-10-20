import type { ReactNode } from "react";
import { getPreferredLocale } from "@/lib/i18n/preference-server";
import { AuthLocaleProvider } from "@/components/auth-locale";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const locale = await getPreferredLocale();
  return (
    <AuthLocaleProvider locale={locale}>
      <SiteNav />
      {children}
      <SiteFooter />
    </AuthLocaleProvider>
  );
}
