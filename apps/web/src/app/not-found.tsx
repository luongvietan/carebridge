import Link from "next/link";
import { CtaPillLink } from "@/components/cta-pill-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { marketingCardShadow, marketingDecorativeNumber, marketingSection } from "@/lib/marketing-ui";

const helpfulLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export default function NotFound() {
  return (
    <>
      <SiteNav />

      <main
        className={`${marketingSection} flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center`}
      >
        <div
          className={`w-full max-w-xl rounded-[28px] bg-[#f5f7f6] px-8 py-12 sm:rounded-[32px] sm:px-12 sm:py-14 ${marketingCardShadow}`}
        >
          <p
            aria-hidden
            className={`text-[clamp(5rem,18vw,7.5rem)] font-bold leading-none tracking-tighter ${marketingDecorativeNumber}`}
          >
            404
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0c4a35] sm:text-3xl">
            Page not found
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#5b6a62] sm:text-base">
            The page you are looking for may have been moved, removed, or the address may be
            incorrect.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CtaPillLink href="/" shadow="lg">
              Back to home
            </CtaPillLink>
          </div>

          <nav aria-label="Helpful links" className="mt-10 border-t border-[#dbe7e0] pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9aa8a0]">
              You might be looking for
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {helpfulLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-medium text-[#0c6e4f] transition hover:text-[#0a5c42] hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
