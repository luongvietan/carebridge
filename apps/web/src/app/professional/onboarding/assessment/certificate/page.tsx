import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { createServiceClient } from "@/lib/supabase/service";
import { buildCertificate } from "@/lib/assessment/certificate";
import { BackLink } from "@/components/back-link";
import { ForwardLink } from "@/components/forward-link";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Competency Certificate — CareBridge Connect" };

export default async function CertificatePage() {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) {
    return <p className="text-sm text-[#4a4a4a]">You must be signed in as a professional.</p>;
  }

  const admin = createServiceClient();
  const [{ data: prof }, { data: attempt }] = await Promise.all([
    admin
      .from("professionals")
      .select("full_name, professional_roles(name)")
      .eq("id", professionalId)
      .single(),
    admin
      .from("assessment_attempts")
      .select("id, score, passed, completed_at")
      .eq("professional_id", professionalId)
      .eq("passed", true)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const role = (prof?.professional_roles as { name: string } | null)?.name ?? "Healthcare Professional";
  const cert = attempt
    ? buildCertificate({ fullName: prof?.full_name ?? "—", roleName: role, attempt })
    : null;

  if (!cert) {
    return (
      <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <h2 className="text-xl font-bold">Certificate not available yet</h2>
        <p className="mt-2 text-sm text-[#4a4a4a]">
          Your competency assessment certificate is generated once you pass the assessment (80% or above).
        </p>
        <ForwardLink
          href="/professional/onboarding/assessment"
          className="mt-6 inline-block rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
        >
          Go to assessment
        </ForwardLink>
      </div>
    );
  }

  return (
    <div>
      <style>{`@media print { .no-print { display: none !important; } @page { size: A4 landscape; margin: 0; } }`}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <BackLink href="/professional/onboarding/profile" className="text-sm text-[#2e7d32] underline">
          Back
        </BackLink>
        <PrintButton
          label="Download / Print certificate"
          className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
        />
      </div>

      {/* Certificate */}
      <div className="mx-auto max-w-3xl rounded-2xl border-2 border-[#2e7d32] bg-white p-10 text-center shadow-[0_8px_30px_-12px_rgba(15,38,28,0.15)]">
        <div className="border-4 border-[#dbe7e0] p-10">
          <p className="text-sm font-semibold tracking-[0.3em] text-[#2e7d32] uppercase">CareBridge Connect</p>
          <h1 className="mt-6 text-3xl font-bold text-[#14301e]">Competency Assessment Certificate</h1>
          <p className="mt-8 text-sm text-[#4a4a4a]">This is to certify that</p>
          <p className="mt-2 text-2xl font-bold text-[#14301e]">{cert.fullName}</p>
          <p className="mt-6 text-sm text-[#4a4a4a]">
            has successfully completed the CareBridge Connect competency assessment for the role of
          </p>
          <p className="mt-2 text-lg font-semibold text-[#2e7d32]">{cert.roleName}</p>
          <p className="mt-6 text-sm text-[#4a4a4a]">
            achieving a score of <span className="font-bold text-[#14301e]">{cert.score}%</span> (pass mark 80%).
          </p>

          <div className="mt-10 flex items-end justify-between text-xs text-[#4a4a4a]">
            <div className="text-left">
              <p className="font-semibold text-[#14301e]">{cert.dateCompleted}</p>
              <p className="mt-1 border-t border-[#dbe7e0] pt-1">Date of completion</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#14301e]">{cert.certificateNumber}</p>
              <p className="mt-1 border-t border-[#dbe7e0] pt-1">Certificate number</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
