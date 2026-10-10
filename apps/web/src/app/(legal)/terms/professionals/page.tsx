import type { Metadata } from "next";
import { LegalTermsPage } from "@/components/legal-terms-page";
import { professionalTerms } from "@/data/legal-copy";
import { professionalTermsPt } from "@/data/legal-copy-pt";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata(): Promise<Metadata> {
  const pt = (await getSelectedCountry()) === "PT";
  return { title: pt ? "Termos e Condições para Profissionais" : "Professional Terms & Conditions" };
}

export default async function ProfessionalTermsPage() {
  const pt = (await getSelectedCountry()) === "PT";
  return <LegalTermsPage isPortuguese={pt} document={pt ? professionalTermsPt : professionalTerms} />;
}
