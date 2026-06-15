import Link from "next/link";
import { BrandMark } from "./site-nav";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/services", label: "Services" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "For professionals",
    links: [
      { href: "/register", label: "Join as a professional" },
      { href: "/services", label: "Roles we cover" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "For clients",
    links: [
      { href: "/register", label: "Register" },
      { href: "/services", label: "How it works" },
      { href: "/contact", label: "Talk to us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms & conditions" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-gradient-to-b from-[#0f3d28] to-[#0a2c1d] text-[#cfe3d6]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-[17px] font-semibold text-white">CareBridge Connect</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#a9c6b5]">
              A compliant healthcare staffing marketplace connecting verified professionals with
              private clients and organisations across the UK.
            </p>
            <div className="mt-5 flex gap-2.5">
              {["in", "x", "f"].map((s) => (
                <span
                  key={s}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#2e573f] text-xs uppercase text-[#a9c6b5]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[#a9c6b5] transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-[#22442f] pt-6 text-xs text-[#8fb39d] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareBridge Connect Ltd. All rights reserved.</p>
          <p>Designed for trust, built for compliance.</p>
        </div>
      </div>
    </footer>
  );
}
