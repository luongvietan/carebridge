import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploader, type DocItem } from "@/components/document-uploader";
import { OnboardingSteps } from "@/components/onboarding-steps";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prof } = user
    ? await supabase
        .from("professionals")
        .select("id, professional_role_id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (!prof?.professional_role_id) {
    return (
      <div>
        <OnboardingSteps current={4} />
        <div className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <h2 className="text-xl font-bold">Complete your profile first</h2>
          <p className="mt-2 text-sm text-[#5b6a62]">
            We need your professional role to know which documents are required.
          </p>
          <Link
            href="/professional/onboarding/profile"
            className="mt-6 inline-block bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027]"
          >
            Go to profile →
          </Link>
        </div>
      </div>
    );
  }

  const { data: required } = await supabase
    .from("compliance_requirements")
    .select("document_type_id, document_types(id, name, is_compliance_critical)")
    .eq("professional_role_id", prof.professional_role_id);

  const { data: existing } = await supabase
    .from("documents")
    .select("document_type_id, verification_status")
    .eq("professional_id", prof.id);

  const statusByType = new Map((existing ?? []).map((d) => [d.document_type_id, d.verification_status]));

  const items: DocItem[] = (required ?? []).map((r) => {
    const dt = r.document_types as { id: string; name: string; is_compliance_critical: boolean } | null;
    return {
      typeId: r.document_type_id,
      name: dt?.name ?? "Document",
      critical: dt?.is_compliance_critical ?? false,
      status: statusByType.get(r.document_type_id) ?? null,
    };
  });

  return <DocumentUploader items={items} />;
}
