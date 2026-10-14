import type { Metadata } from "next";
import { LegalTermsPage } from "@/components/legal-terms-page";
import { PtLegalPage, ptLegalMetadata, type LegalSearchParams } from "@/components/pt-legal-page";
import { professionalTerms } from "@/data/legal-copy";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }): Promise<Metadata> {
  if ((await getSelectedCountry()) === "PT") return ptLegalMetadata("professionalTerms", searchParams);
  return { title: "Professional Terms & Conditions" };
}

export default async function ProfessionalTermsPage({ searchParams }: { searchParams: LegalSearchParams }) {
  if ((await getSelectedCountry()) === "PT") return <PtLegalPage docKey="professionalTerms" searchParams={searchParams} />;
  return <LegalTermsPage document={professionalTerms} />;
}
