import { getPreferredLocale } from "@/lib/i18n/preference-server";
import { makeT } from "@/lib/i18n/portal";

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

export default async function NotFound() {
  const t = makeT(await getPreferredLocale());
  return (
    <>
      <SiteNav />

      <main id="main-content" tabIndex={-1}
        className={`${marketingSection} flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center`}
      >
        <div
          className={`w-full max-w-xl rounded-[28px] bg-surface px-8 py-12 sm:rounded-[32px] sm:px-12 sm:py-14 ${marketingCardShadow}`}
        >
          <p
            aria-hidden
            className={`text-[clamp(5rem,18vw,7.5rem)] font-bold leading-none tracking-tighter ${marketingDecorativeNumber}`}
          >
            404
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
            {t("Page not found")}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink sm:text-base">
            {t("The page you are looking for may have been moved, removed, or the address may be incorrect.")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CtaPillLink href="/" shadow="lg">
              {t("Back to home")}
            </CtaPillLink>
          </div>

          <nav aria-label={t("Helpful links")} className="mt-10 border-t border-line pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {t("You might be looking for")}
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {helpfulLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-medium text-brand-strong transition hover:text-brand-strong-hover hover:underline"
                  >
                    {t(label)}
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
