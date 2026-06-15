"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CtaPillLink } from "@/components/cta-pill-link";
import { Cancel01Icon, Icon, Menu01Icon } from "@/components/ui/icon";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Professional roles" },
  { href: "/faq", label: "FAQ" },
];

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#E6F4EA" />
      <path d="M14 26V14h4v4h4v-4h4v12h-4v-4h-4v4h-4z" fill="#0c6e4f" opacity="0.85" />
      <path
        d="M22 10c3 2 5 5 5 9 0 1.2-.3 2.3-.8 3.2-.5.9-1.2 1.6-2 2.1"
        stroke="#7ed7a0"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M24 12c1.5 1.8 2.2 3.8 2 6-.1 1-.5 1.9-1.1 2.6" fill="#198038" opacity="0.35" />
    </svg>
  );
}

function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <BrandMark />
      <span className="leading-tight">
        <span className="block text-[17px] font-bold tracking-tight text-[#0c6e4f]">
          CareBridge
        </span>
        <span className="block text-[15px] font-semibold tracking-tight text-[#198038]">
          Connect
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-[15px] font-medium transition-colors ${
              isActive ? "text-[#0c4a35]" : "text-[#4a6358] hover:text-[#198038]"
            }`}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#198038]" aria-hidden />
            )}
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7efe9] bg-white/90 backdrop-blur-md">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8 lg:py-5">
        <div className="hidden lg:flex lg:justify-start">
          <div className="inline-flex items-center rounded-full border border-[#e3ece6] bg-[#f7faf8] px-1.5 py-1">
            <NavLinks />
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3ece6] text-[#445049] lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={2} />
        </button>

        <BrandLogo className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:justify-self-center" />

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#445049] transition-colors hover:text-[#198038] sm:block"
          >
            Sign in
          </Link>
          <CtaPillLink href="/contact">Contact Us</CtaPillLink>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#e7efe9] bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1 rounded-2xl border border-[#e3ece6] bg-[#f7faf8] p-2">
            <NavLinks onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
