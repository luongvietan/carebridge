import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  return (
    <header className="border-b border-slate-200">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="font-bold">
          CareBridge Connect
        </Link>
        <div className="hidden gap-5 text-sm sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-600 hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link href="/register" className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white">
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}
