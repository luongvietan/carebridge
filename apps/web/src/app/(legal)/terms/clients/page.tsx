import type { Metadata } from "next";
import { LegalTermsPage } from "@/components/legal-terms-page";
import { clientTerms } from "@/data/legal-copy";
import { clientTermsPt } from "@/data/legal-copy-pt";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export async function generateMetadata(): Promise<Metadata> {
  const pt = (await getSelectedCountry()) === "PT";
  return { title: pt ? "Termos e Condições para Clientes" : "Client Terms & Conditions" };
}

export default async function ClientTermsPage() {
  const pt = (await getSelectedCountry()) === "PT";
  return <LegalTermsPage isPortuguese={pt} document={pt ? clientTermsPt : clientTerms} />;
}
