import { getPortalT } from "@/lib/i18n/portal-server";
import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { createServiceClient } from "@/lib/supabase/service";
import { buildCertificate } from "@/lib/assessment/certificate";
import { BackLink } from "@/components/back-link";
import { ForwardLink } from "@/components/forward-link";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Competency Certificate — CareBridge Connect" };

export default async function CertificatePage() {
  const [{ t }, user] = await Promise.all([
    getPortalT().then((t) => ({ t })),
    requireAuth(),
  ]);
  const professionalId = await ensureProfessional(user);
  if (!professionalId) {
    return <p className="text-sm text-ink">{t("You must be signed in as a professional.")}</p>;
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
      <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <h2 className="text-xl font-bold">{t("Certificate not available yet")}</h2>
        <p className="mt-2 text-sm text-ink">
          {t("Your onboarding assessment completion record is available after passing with 80% or above.")}
        </p>
        <ForwardLink
          href="/professional/onboarding/assessment"
          className="mt-6 inline-block rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover"
        >
          {t("Go to assessment")}
        </ForwardLink>
      </div>
    );
  }

  return (
    <div>
      <style>{`@media print { .no-print { display: none !important; } @page { size: A4 landscape; margin: 0; } }`}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <BackLink href="/professional/onboarding/profile" className="text-sm text-brand-strong underline">
          {t("Back")}
        </BackLink>
        <PrintButton
          label={t("Download / Print certificate")}
          className="rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover"
        />
      </div>

      {/* Certificate */}
      <div className="mx-auto max-w-3xl rounded-2xl border-2 border-brand-strong bg-white p-10 text-center shadow-[0_8px_30px_-12px_rgba(15,38,28,0.15)]">
        <div className="border-4 border-line p-10">
          <p className="text-sm font-semibold tracking-[0.3em] text-brand-strong uppercase">{t("CareBridge Connect")}</p>
          <h1 className="mt-6 text-3xl font-bold text-heading">{t("CareBridge onboarding assessment passed")}</h1>
          <p className="mt-8 text-sm text-ink">{t("This records that")}</p>
          <p className="mt-2 text-2xl font-bold text-heading">{cert.fullName}</p>
          <p className="mt-6 text-sm text-ink">
            {t("has passed the CareBridge Connect onboarding assessment associated with the role of")}
          </p>
          <p className="mt-2 text-lg font-semibold text-brand-strong">{t(cert.roleName)}</p>
          <p className="mt-6 text-sm text-ink">
            {t("achieving a score of")}{" "}<span className="font-bold text-heading">{cert.score}%</span>{" "}{t("(pass mark 80%).")}
          </p>

          <p className="mt-6 text-sm text-ink">{t("This is not an accredited qualification and does not replace any legally required qualifications, registration or training.")}</p>
          <div className="mt-10 flex items-end justify-between text-xs text-ink">
            <div className="text-left">
              <p className="font-semibold text-heading">{cert.dateCompleted}</p>
              <p className="mt-1 border-t border-line pt-1">{t("Date of completion")}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-heading">{cert.certificateNumber}</p>
              <p className="mt-1 border-t border-line pt-1">{t("Certificate number")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
