"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { BrandMark } from "@/components/site-nav-client";
import { signOut } from "@/lib/auth/actions";
import type { RoleNavItem } from "@/lib/auth/role-nav";
import { Cancel01Icon, Icon, Menu01Icon } from "@/components/ui/icon";

function isActive(pathname: string, href: string) {
  if (href === "/professional" || href === "/client" || href === "/organisation" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type RoleNavProps = {
  areaLabel: string;
  items: RoleNavItem[];
  email: string | null;
};

export function RoleNav({ areaLabel, items, email }: RoleNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  const linkClass = (href: string, mobile: boolean) => {
    const active = isActive(pathname, href);
    if (mobile) {
      return active
        ? "block rounded-md bg-[#198038] px-3 py-2 text-sm text-white"
        : "block rounded-md px-3 py-2 text-sm text-[#525252] hover:bg-[#f4f4f4] hover:text-[#161616]";
    }
    return active
      ? "rounded-md bg-white px-3 py-1.5 text-sm font-medium text-[#198038] shadow-sm"
      : "rounded-md px-3 py-1.5 text-sm text-[#525252] hover:text-[#161616]";
  };

  return (
    <>
      <header className="border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e0e0e0] text-[#525252] lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={18} strokeWidth={2} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <BrandMark size={32} />
              <span className="hidden text-sm font-semibold text-[#198038] sm:block">CareBridge Connect</span>
            </Link>
          </div>

          <p className="text-xs tracking-wide text-[#525252] uppercase sm:text-sm">{areaLabel}</p>

          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden max-w-[12rem] truncate text-sm text-[#525252] sm:block" title={email}>
                {email}
              </span>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={pending}
              className="text-sm text-[#525252] underline-offset-2 hover:text-[#161616] hover:underline disabled:opacity-50"
            >
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#e0e0e0] px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={linkClass(item.href, true)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <nav className="hidden border-b border-[#e0e0e0] bg-[#f4f4f4] lg:block">
        <div className="mx-auto flex max-w-6xl gap-1 px-6 py-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href, false)}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
