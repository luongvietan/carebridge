import type { Metadata } from "next";
import { BackLink } from "@/components/back-link";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { clientTerms } from "@/data/legal-copy";

export const metadata: Metadata = {
  title: "Client Terms & Conditions — CareBridge Connect",
};

export default function ClientTermsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <BackLink
          href="/terms"
          className="text-sm font-semibold text-[#2e7d32] hover:underline"
        >
          All terms &amp; conditions
        </BackLink>
        <div className="mt-6">
          <LegalDocument title={clientTerms.title} sections={clientTerms.sections} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
