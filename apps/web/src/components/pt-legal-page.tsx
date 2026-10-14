import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import {
  PT_LEGAL_INDEX,
  PT_LEGAL_PACK,
  PT_LEGAL_ROUTES,
  legalLangFromParam,
  type LegalDocKey,
  type LegalLang,
} from "@/data/legal-copy-pt";

export type LegalSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function ptLegalMetadata(docKey: LegalDocKey, searchParams: LegalSearchParams): Promise<Metadata> {
  const lang = legalLangFromParam((await searchParams).lang);
  return { title: PT_LEGAL_PACK[lang][docKey].title };
}

/** `path` in the given language: Portuguese is the bare path, English adds `?lang=en`. */
export function legalHref(path: string, lang: LegalLang): string {
  return lang === "en" ? `${path}?lang=en` : path;
}

/** Links to the same page in the other language. */
export function LegalLanguageSwitch({ path, lang }: { path: string; lang: LegalLang }) {
  return lang === "pt" ? (
    <p className="text-sm">
      <Link href={legalHref(path, "en")} hrefLang="en" lang="en" className="font-semibold text-brand-strong hover:underline">
        English version
      </Link>
    </p>
  ) : (
    <div className="space-y-2 text-sm">
      <p>
        <Link href={path} hrefLang="pt-PT" lang="pt-PT" className="font-semibold text-brand-strong hover:underline">
          Versão portuguesa
        </Link>
      </p>
      <p role="note" className="rounded-xl border border-line bg-surface px-4 py-3 leading-relaxed text-ink">
        This English text is a convenience translation. The European Portuguese version governs services offered in
        Portugal, subject to mandatory law.
      </p>
    </div>
  );
}

/** One document of the Portuguese legal pack, in Portuguese or its English translation. */
export async function PtLegalPage({ docKey, searchParams }: { docKey: LegalDocKey; searchParams: LegalSearchParams }) {
  const lang = legalLangFromParam((await searchParams).lang);
  const doc = PT_LEGAL_PACK[lang][docKey];
  return (
    <>
      <SiteNav />
      <main id="main-content" tabIndex={-1} lang={lang === "en" ? "en" : undefined} className="mx-auto max-w-3xl px-5 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <BackLink href={legalHref("/terms", lang)} className="text-sm font-semibold text-brand-strong hover:underline">
            {PT_LEGAL_INDEX[lang].allDocuments}
          </BackLink>
        </div>
        <div className="mt-4">
          <LegalLanguageSwitch path={PT_LEGAL_ROUTES[docKey]} lang={lang} />
        </div>
        <div className="mt-8">
          <LegalDocument title={doc.title} intro={doc.intro} sections={doc.sections} facts={doc.facts} lang={lang} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
