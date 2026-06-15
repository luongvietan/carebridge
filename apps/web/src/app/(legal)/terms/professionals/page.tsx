import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { professionalTerms } from "@/data/legal-copy";

export const metadata: Metadata = {
  title: "Professional Terms & Conditions — CareBridge Connect",
};

export default function ProfessionalTermsPage() {
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
          <LegalDocument title={professionalTerms.title} sections={professionalTerms.sections} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
