import { PtLegalPage, ptLegalMetadata, type LegalSearchParams } from "@/components/pt-legal-page";

export function generateMetadata({ searchParams }: { searchParams: LegalSearchParams }) {
  return ptLegalMetadata("cancellation", searchParams);
}

export default function CancellationPolicyPage({ searchParams }: { searchParams: LegalSearchParams }) {
  return <PtLegalPage docKey="cancellation" searchParams={searchParams} />;
}
