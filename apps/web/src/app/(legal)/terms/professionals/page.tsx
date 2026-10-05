import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { professionalTerms } from "@/data/legal-copy";
import { professionalTermsPt, termsIndexPt } from "@/data/legal-copy-pt";
import { LegalDraftNotice } from "@/components/legal-draft-notice";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata(): Promise<Metadata> {
  const pt = (await getSelectedCountry()) === "PT";
  return { title: `${pt ? "Termos e Condições para Profissionais" : "Professional Terms & Conditions"}` };
}

export default async function ProfessionalTermsPage() {
  const pt = (await getSelectedCountry()) === "PT";
  const doc = pt ? professionalTermsPt : professionalTerms;
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <BackLink
          href="/terms"
          className="text-sm font-semibold text-[#2e7d32] hover:underline"
        >
          {pt ? termsIndexPt.allTerms : "All terms & conditions"}
        </BackLink>
        <div className="mt-6">
          {pt && <LegalDraftNotice />}
          <LegalDocument title={doc.title} sections={doc.sections} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
