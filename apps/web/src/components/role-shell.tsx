import type { ReactNode } from "react";
import { RoleNav } from "@/components/role-nav";
import { PortalBreadcrumbs } from "@/components/portal-breadcrumbs";
import { PortalLocaleProvider } from "@/components/portal-locale";
import { getPortalLocale } from "@/lib/i18n/portal-server";
import type { AccountType } from "@/lib/auth/rbac";
import { ROLE_LABEL, ROLE_NAV } from "@/lib/auth/role-nav";

type RoleShellProps = {
  accountType: AccountType;
  email: string | null;
  children: ReactNode;
};

export async function RoleShell({ accountType, email, children }: RoleShellProps) {
  const locale = await getPortalLocale();
  return (
    <PortalLocaleProvider locale={locale}>
    <div lang={locale} className="min-h-screen bg-white">
      <RoleNav areaLabel={ROLE_LABEL[accountType]} items={ROLE_NAV[accountType]} email={email} />
      <PortalBreadcrumbs accountType={accountType} />
      {children}
    </div>
    </PortalLocaleProvider>
  );
}
