import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight01Icon, Icon } from "@/components/ui/icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { LegalLanguageSwitch, legalHref, type LegalSearchParams } from "@/components/pt-legal-page";
import {
  PT_LEGAL_INDEX,
  PT_LEGAL_PACK,
  PT_LEGAL_ROUTES,
  PT_LEGAL_SUMMARIES,
  legalLangFromParam,
  type LegalDocKey,
} from "@/data/legal-copy-pt";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }): Promise<Metadata> {
  const pt = (await getSelectedCountry()) === "PT";
  return { title: pt ? PT_LEGAL_INDEX[legalLangFromParam((await searchParams).lang)].title : "Terms & Conditions" };
}

const termsLinks = [
  {
    href: "/terms/clients",
    title: "Client Terms & Conditions",
    description:
      "Terms governing the use of CareBridge Connect by clients seeking healthcare support services.",
  },
  {
    href: "/terms/professionals",
    title: "Professional Terms & Conditions",
    description:
      "Terms governing the use of CareBridge Connect by healthcare professionals on the platform.",
  },
] as const;

export default async function TermsPage({ searchParams }: { searchParams: LegalSearchParams }) {
  const pt = (await getSelectedCountry()) === "PT";
  const lang = legalLangFromParam((await searchParams).lang);
  const links = pt
    ? (Object.keys(PT_LEGAL_ROUTES) as LegalDocKey[]).map((key) => ({
        href: legalHref(PT_LEGAL_ROUTES[key], lang),
        title: PT_LEGAL_PACK[lang][key].title,
        description: PT_LEGAL_SUMMARIES[lang][key],
      }))
    : termsLinks;
  return (
    <>
      <SiteNav />
      <main id="main-content" tabIndex={-1} lang={pt && lang === "en" ? "en" : undefined} className="mx-auto max-w-3xl px-5 py-16">
        {pt && (
          <div className="mb-6">
            <LegalLanguageSwitch path="/terms" lang={lang} />
          </div>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-heading">
          {pt ? PT_LEGAL_INDEX[lang].title : "Terms & Conditions"}
        </h1>
        <p className="mt-5 leading-relaxed text-ink">
          {pt
            ? PT_LEGAL_INDEX[lang].intro
            : "CareBridge Connect provides separate terms for clients and healthcare professionals. Select the document that applies to you."}
        </p>

        <div className="mt-10 space-y-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl border border-[#e7efe9] bg-white p-6 transition hover:border-brand-strong hover:shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)]"
            >
              <h2 className="text-lg font-semibold text-brand-ink">{link.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink">{link.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
                {pt ? PT_LEGAL_INDEX[lang].readDocument : "Read document"}
                <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
