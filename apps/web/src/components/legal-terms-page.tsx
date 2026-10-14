import { BackLink } from "@/components/back-link";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

type LegalTermsPageProps = {
  document: Parameters<typeof LegalDocument>[0];
};

/** A UK terms document; Portugal's legal pack renders through `PtLegalPage`. */
export function LegalTermsPage({ document }: LegalTermsPageProps) {
  return (
    <>
      <SiteNav />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-16">
        <BackLink href="/terms" className="text-sm font-semibold text-brand-strong hover:underline">
          All terms &amp; conditions
        </BackLink>
        <div className="mt-6">
          <LegalDocument title={document.title} sections={document.sections} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
