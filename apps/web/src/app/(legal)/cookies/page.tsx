import { PtLegalPage, ptLegalMetadata, type LegalSearchParams } from "@/components/pt-legal-page";

export function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }) {
  return ptLegalMetadata("cookies", searchParams);
}

export default function CookiesPage({ searchParams }: { searchParams: LegalSearchParams }) {
  return <PtLegalPage docKey="cookies" searchParams={searchParams} />;
}
