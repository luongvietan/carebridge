"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePortalT } from "@/components/portal-locale";
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
  const t = usePortalT();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    headerRef.current?.querySelector<HTMLElement>(`[id="${menuId}"] a`)?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenuOpen(false); toggleRef.current?.focus(); }
    }
    function onPointer(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onResize() { if (window.innerWidth >= 1024) setMenuOpen(false); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onResize);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); window.removeEventListener("resize", onResize); };
  }, [menuOpen, menuId]);
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
          active ? "bg-white text-brand-ink shadow-sm" : "text-ink hover:text-brand-strong"
        }`}
      >
        {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-strong" aria-hidden />}
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
            ? "bg-brand-strong font-medium text-white"
            : "text-ink hover:bg-surface-hover hover:text-brand-strong"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-[#e7efe9] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-5 py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece6] text-ink lg:hidden"
            ref={toggleRef}
          aria-controls={menuId}
          aria-expanded={menuOpen}
            aria-label={menuOpen ? t("Close menu") : t("Open menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={2} />
          </button>
          <Link href="/" className="flex items-center">
            <BrandMark height={36} />
          </Link>
          <span className="ml-1 hidden rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold text-brand-strong sm:inline-block">
            {t(areaLabel)}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {email && (
            <span className="hidden max-w-[12rem] truncate text-sm text-ink md:block" title={email}>
              {email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            className="shrink-0 rounded-full px-2 py-2 text-sm font-medium sm:px-4 text-ink transition-colors hover:text-brand-strong disabled:opacity-50"
          >
            {pending ? t("Signing out…") : t("Sign out")}
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-[#e7efe9] lg:block">
        <div className="mx-auto max-w-7xl px-5 py-2.5 lg:px-8">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#e3ece6] bg-[#f7faf8] px-1.5 py-1">
            {items.map((item) => desktopLink(item.href, t(item.label)))}
          </div>
        </div>
      </nav>

      {menuOpen && (
        <nav id={menuId} aria-label={t(areaLabel)} className="border-t border-[#e7efe9] bg-white px-5 py-4 lg:hidden">
          <span className="mb-2 inline-block rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold text-brand-strong">
            {t(areaLabel)}
          </span>
          <div className="flex flex-col gap-1 rounded-2xl border border-[#e3ece6] bg-[#f7faf8] p-2">
            {items.map((item) => mobileLink(item.href, t(item.label)))}
          </div>
        </nav>
      )}
    </header>
  );
}
