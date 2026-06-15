import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-xl bg-[#198038]"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 15c4.5-7 13.5-7 18 0" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
        <path d="M12 3.5v7M8.5 7h7" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e7efe9] bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-tight text-[#0f261c]">
            CareBridge<span className="text-[#198038]"> Connect</span>
          </span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#445049] md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-[#198038]">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#445049] transition-colors hover:text-[#198038] sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#198038] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e6027]"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
