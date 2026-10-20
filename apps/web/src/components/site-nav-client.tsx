"use client";
import { LanguageSwitch } from "@/components/language-switch";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CtaPillLink } from "@/components/cta-pill-link";
import { Cancel01Icon, Icon, Menu01Icon } from "@/components/ui/icon";

type NavLabels = {
  home: string;
  about: string;
  roles: string;
  faq: string;
  contactUs: string;
  signIn: string;
  dashboard: string;
  openMenu: string;
  closeMenu: string;
};

function navLinks(l: NavLabels) {
  return [
    { href: "/", label: l.home },
    { href: "/about", label: l.about },
    { href: "/services", label: l.roles },
    { href: "/faq", label: l.faq },
  ];
}

export function BrandMark({ height = 40 }: { height?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
    <Image
      src="/icon-192.png"
      alt="CareBridge Connect"
      width={height}
      height={height}
      priority
      className="shrink-0 object-contain"
      style={{ height, width: height }}
    />
      <span aria-hidden="true" className="text-left leading-tight">
        <span className="block text-sm font-bold tracking-tight text-brand-ink sm:text-base">CareBridge</span>
        <span className="block text-[10px] font-medium tracking-wide text-ink sm:text-xs">Connect</span>
      </span>
    </span>
  );
}

function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <BrandMark height={44} />
    </Link>
  );
}

function NavLinks({ onNavigate, labels }: { onNavigate?: () => void; labels: NavLabels }) {
  const pathname = usePathname();
  const links = navLinks(labels);

  return (
    <>
      {links.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-[15px] font-medium transition-colors ${
              isActive ? "text-brand-ink" : "text-ink hover:text-brand-strong"
            }`}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6cc24a]" aria-hidden />
            )}
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

type SiteNavClientProps = {
  dashboardHref: string | null;
  labels: NavLabels;
};

export function SiteNavClient({ dashboardHref, labels }: SiteNavClientProps) {
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

  const accountLink = dashboardHref ? (
    <Link
      href={dashboardHref}
      className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-brand-strong"
    >
      {labels.dashboard}
    </Link>
  ) : (
    <Link
      href="/login"
      className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-brand-strong"
    >
      {labels.signIn}
    </Link>
  );

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-[#e7efe9] bg-white/90 backdrop-blur-md">
      <nav className="relative mx-auto grid max-w-7xl grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-5 py-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8 lg:py-5">
        <div className="hidden lg:flex lg:justify-start">
          <div className="inline-flex items-center rounded-full border border-[#e3ece6] bg-[#f7faf8] px-1.5 py-1">
            <NavLinks labels={labels} />
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece6] text-ink lg:hidden"
          ref={toggleRef}
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? labels.closeMenu : labels.openMenu}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={2} />
        </button>

        <BrandLogo className="min-w-0 justify-self-center lg:justify-self-center" />

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <LanguageSwitch />
          <div className="text-xs [&_a]:px-2 [&_a]:text-xs sm:[&_a]:px-4 sm:[&_a]:text-sm">{accountLink}</div>
          <div className="hidden sm:block"><CtaPillLink href="/contact">{labels.contactUs}</CtaPillLink></div>
        </div>
      </nav>

      {menuOpen && (
        <div id={menuId} className="border-t border-[#e7efe9] bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1 rounded-2xl border border-[#e3ece6] bg-[#f7faf8] p-2">
            <NavLinks labels={labels} onNavigate={() => setMenuOpen(false)} />
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-2 font-medium text-brand-ink sm:hidden">{labels.contactUs}</Link>
            <div className="mt-1 border-t border-[#e3ece6] pt-1 sm:hidden">
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-brand-strong"
                >
                  {labels.dashboard}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-brand-strong"
                >
                  {labels.signIn}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
