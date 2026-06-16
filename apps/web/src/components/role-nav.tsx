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

  const desktopLink = (href: string, label: string) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          active ? "bg-white text-[#0c4a35] shadow-sm" : "text-[#4a6358] hover:text-[#198038]"
        }`}
      >
        {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#198038]" aria-hidden />}
        {label}
      </Link>
    );
  };

  const mobileLink = (href: string, label: string) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMenuOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-[#198038] font-medium text-white"
            : "text-[#445049] hover:bg-[#eef5f0] hover:text-[#198038]"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7efe9] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece6] text-[#445049] lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={2} />
          </button>
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size={36} />
            <span className="hidden leading-tight sm:block">
              <span className="block text-[16px] font-bold tracking-tight text-[#0c6e4f]">CareBridge</span>
              <span className="block text-[14px] font-semibold tracking-tight text-[#198038]">Connect</span>
            </span>
          </Link>
          <span className="ml-1 hidden rounded-full bg-[#eef5f0] px-3 py-1 text-xs font-semibold text-[#0c6e4f] sm:inline-block">
            {areaLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden max-w-[12rem] truncate text-sm text-[#5b6a62] md:block" title={email}>
              {email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            className="rounded-full px-4 py-2 text-sm font-medium text-[#445049] transition-colors hover:text-[#198038] disabled:opacity-50"
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-[#e7efe9] lg:block">
        <div className="mx-auto max-w-7xl px-5 py-2.5 lg:px-8">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#e3ece6] bg-[#f7faf8] px-1.5 py-1">
            {items.map((item) => desktopLink(item.href, item.label))}
          </div>
        </div>
      </nav>

      {menuOpen && (
        <nav className="border-t border-[#e7efe9] bg-white px-5 py-4 lg:hidden">
          <span className="mb-2 inline-block rounded-full bg-[#eef5f0] px-3 py-1 text-xs font-semibold text-[#0c6e4f]">
            {areaLabel}
          </span>
          <div className="flex flex-col gap-1 rounded-2xl border border-[#e3ece6] bg-[#f7faf8] p-2">
            {items.map((item) => mobileLink(item.href, item.label))}
          </div>
        </nav>
      )}
    </header>
  );
}
