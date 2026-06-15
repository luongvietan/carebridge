import type { Metadata } from "next";
import Link from "next/link";
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
        <Link
          href="/terms"
          className="text-sm font-semibold text-[#0c6e4f] hover:underline"
        >
          ← All terms &amp; conditions
        </Link>
        <div className="mt-6">
          <LegalDocument title={clientTerms.title} sections={clientTerms.sections} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
