import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LegalDraftNotice } from "@/components/legal-draft-notice";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { privacyPolicyPt } from "@/data/legal-copy-pt";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata(): Promise<Metadata> {
  const pt = (await getSelectedCountry()) === "PT";
  return { title: `${pt ? privacyPolicyPt.title : "Privacy Policy"}` };
}

export default async function PrivacyPage() {
  const pt = (await getSelectedCountry()) === "PT";
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        {pt ? (
          <>
            <LegalDraftNotice />
            <LegalDocument title={privacyPolicyPt.title} sections={privacyPolicyPt.sections} />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-[#14301e]">Privacy Policy</h1>
            <p className="mt-5 leading-relaxed text-[#4a4a4a]">
              CareBridge Connect Ltd handles personal data in line with UK GDPR. We collect only the
              information needed to verify professionals, manage bookings and process payments, store it
              securely, and never share it without a lawful basis. This placeholder will be replaced with
              the final policy before launch.
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
