"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalT, usePortalLocale } from "@/components/portal-locale";
import type { AccountType } from "@/lib/auth/rbac";
import { ROLE_NAV } from "@/lib/auth/role-nav";

export function PortalBreadcrumbs({ accountType }: { accountType: AccountType }) {
  const pathname = usePathname();
  const t = usePortalT();
  const pt = usePortalLocale() === "pt-PT";
  const items = ROLE_NAV[accountType];
  const home = items[0];
  if (!home || pathname === home.href) return null;
  const current = items.filter(item => item.href !== home.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <nav aria-label={pt ? "Localização na plataforma" : "Breadcrumb"} className="mx-auto flex max-w-4xl flex-wrap gap-2 px-4 pt-6 text-sm text-ink">
      <Link href={home.href} className="text-brand-strong underline underline-offset-4">{t(home.label)}</Link>
      {current && <><span aria-hidden="true">/</span><Link href={current.href} aria-current={pathname === current.href ? "page" : undefined} className="text-brand-strong underline underline-offset-4">{t(current.label)}</Link></>}
    </nav>
  );
}
