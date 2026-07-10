import { ForwardLink } from "@/components/forward-link";
import { createClient } from "@/lib/supabase/server";
import { DocumentUploader, type DocItem } from "@/components/document-uploader";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { guardOnboardingStep } from "@/lib/onboarding/guard";
import { isImageStoragePath } from "@/lib/onboarding/upload-rules";
import type { ExistingFile } from "@/components/ui/file-input";

export default async function DocumentsPage() {
  await guardOnboardingStep("documents");
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
          <p className="mt-2 text-sm text-[#4a4a4a]">
            We need your professional role to know which documents are required.
          </p>
          <ForwardLink
            href="/professional/onboarding/profile"
            className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
          >
            Go to profile
          </ForwardLink>
        </div>
      </div>
    );
  }

  const [{ data: required }, { data: existing }] = await Promise.all([
    supabase
      .from("compliance_requirements")
      .select("document_type_id, document_types(id, name, is_compliance_critical, has_expiry)")
      .eq("professional_role_id", prof.professional_role_id),
    supabase
      .from("documents")
      .select("document_type_id, verification_status, rejection_reason, storage_path, original_filename")
      .eq("professional_id", prof.id)
      .is("superseded_at", null)
      .order("created_at", { ascending: true }),
  ]);

  // Latest non-superseded row per type wins (ordered ascending → last set).
  const statusByType = new Map((existing ?? []).map((d) => [d.document_type_id, d.verification_status]));
  const reasonByType = new Map((existing ?? []).map((d) => [d.document_type_id, d.rejection_reason]));
  const rowByType = new Map((existing ?? []).map((d) => [d.document_type_id, d]));

  // Sign short-lived preview + download URLs so the professional can review the
  // document they already submitted (the bucket is private).
  const existingByType = new Map<string, ExistingFile>();
  await Promise.all(
    [...rowByType.values()].map(async (d) => {
      if (!d.storage_path) return;
      const downloadName = d.original_filename ?? undefined;
      const [{ data: preview }, { data: download }] = await Promise.all([
        supabase.storage.from("documents").createSignedUrl(d.storage_path, 600),
        supabase.storage
          .from("documents")
          .createSignedUrl(d.storage_path, 600, { download: downloadName ?? true }),
      ]);
      if (!preview?.signedUrl) return;
      existingByType.set(d.document_type_id, {
        url: preview.signedUrl,
        kind: isImageStoragePath(d.storage_path) ? "image" : "pdf",
        filename: d.original_filename,
        downloadUrl: download?.signedUrl ?? null,
      });
    }),
  );

  const items: DocItem[] = (required ?? []).map((r) => {
    const dt = r.document_types as {
      id: string;
      name: string;
      is_compliance_critical: boolean;
      has_expiry: boolean;
    } | null;
    return {
      typeId: r.document_type_id,
      name: dt?.name ?? "Document",
      critical: dt?.is_compliance_critical ?? false,
      hasExpiry: dt?.has_expiry ?? false,
      status: statusByType.get(r.document_type_id) ?? null,
      rejectionReason: reasonByType.get(r.document_type_id) ?? null,
      existing: existingByType.get(r.document_type_id) ?? null,
    };
  });

  return <DocumentUploader items={items} />;
}
