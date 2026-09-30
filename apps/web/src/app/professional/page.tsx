import { getPortalT } from "@/lib/i18n/portal-server";
import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { loadVerificationSummary } from "@/lib/compliance/load-verification";
import { VerifiedBadge } from "@/components/verified-badge";

export default async function ProfessionalHome() {
  const t = await getPortalT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The professional's own verification status, so they can see exactly what is
  // outstanding rather than guessing why they cannot accept bookings yet.
  const { data: professional } = user
    ? await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const verification = professional
    ? await loadVerificationSummary(createServiceClient(), professional.id)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("Dashboard")}</h1>
      {user?.email && (
        <p className="mt-2 text-sm text-[#4a4a4a]">{t("Signed in as")}{" "}{user.email}</p>
      )}

      {verification && (
        <div className="mt-5">
          <VerifiedBadge
            checks={verification.checks}
            fullyVerified={verification.fullyVerified}
          />
        </div>
      )}

      <DashboardGrid
        cards={[
          {
            href: "/professional/messages",
            title: t("Messages"),
            description: t(
              "Message the CareBridge Connect team and read their replies.",
            ),
            cta: t("Open messages"),
          },
          {
            href: "/professional/onboarding/eligibility",
            title: t("Onboarding"),
            description: t(
              "Complete eligibility screening, competency assessment, profile details and document upload.",
            ),
            cta: t("Continue onboarding"),
          },
          {
            href: "/professional/roles",
            title: t("Your roles"),
            description: t(
              "See every role you work in, what each one is still waiting for, and apply for another.",
            ),
            cta: t("Manage roles"),
          },
          {
            href: "/professional/bookings",
            title: t("Bookings"),
            description: t(
              "Browse open shifts in your role and manage your accepted assignments.",
            ),
            cta: t("View bookings"),
          },
          {
            href: "/professional/earnings",
            title: t("Earnings"),
            description: t(
              "See payouts recorded for your completed bookings and your total paid to date.",
            ),
            cta: t("View earnings"),
          },
        ]}
      />
    </main>
  );
}
