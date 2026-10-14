import type { Metadata } from "next";
import { LegalTermsPage } from "@/components/legal-terms-page";
import { PtLegalPage, ptLegalMetadata, type LegalSearchParams } from "@/components/pt-legal-page";
import { clientTerms } from "@/data/legal-copy";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }): Promise<Metadata> {
  if ((await getSelectedCountry()) === "PT") return ptLegalMetadata("generalTerms", searchParams);
  return { title: "Client Terms & Conditions" };
}

export default async function ClientTermsPage({ searchParams }: { searchParams: LegalSearchParams }) {
  if ((await getSelectedCountry()) === "PT") return <PtLegalPage docKey="generalTerms" searchParams={searchParams} />;
  return <LegalTermsPage document={clientTerms} />;
}
