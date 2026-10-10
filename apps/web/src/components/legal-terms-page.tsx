import { BackLink } from "@/components/back-link";
import { LegalDocument } from "@/components/legal-document";
import { LegalDraftNotice } from "@/components/legal-draft-notice";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { termsIndexPt } from "@/data/legal-copy-pt";

type LegalTermsPageProps = {
  isPortuguese: boolean;
  document: Parameters<typeof LegalDocument>[0];
};

export function LegalTermsPage({ isPortuguese, document }: LegalTermsPageProps) {
  return (
    <>
      <SiteNav />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-16">
        <BackLink href="/terms" className="text-sm font-semibold text-brand-strong hover:underline">
          {isPortuguese ? termsIndexPt.allTerms : "All terms & conditions"}
        </BackLink>
        <div className="mt-6">
          {isPortuguese && <LegalDraftNotice />}
          <LegalDocument title={document.title} sections={document.sections} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
