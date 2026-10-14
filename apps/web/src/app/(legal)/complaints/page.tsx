import { PtLegalPage, ptLegalMetadata, type LegalSearchParams } from "@/components/pt-legal-page";

export function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }) {
  return ptLegalMetadata("complaints", searchParams);
}

export default function ComplaintsPage({ searchParams }: { searchParams: LegalSearchParams }) {
  return <PtLegalPage docKey="complaints" searchParams={searchParams} />;
}
