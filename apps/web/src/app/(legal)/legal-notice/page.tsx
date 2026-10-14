import { PtLegalPage, ptLegalMetadata, type LegalSearchParams } from "@/components/pt-legal-page";

export function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }) {
  return ptLegalMetadata("legalNotice", searchParams);
}

export default function LegalNoticePage({ searchParams }: { searchParams: LegalSearchParams }) {
  return <PtLegalPage docKey="legalNotice" searchParams={searchParams} />;
}
