import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { loadVerificationSummary } from "@/lib/compliance/load-verification";
import { VerifiedBadge } from "@/components/verified-badge";

export default async function ProfessionalHome() {
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
      <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
      {user?.email && (
        <p className="mt-2 text-sm text-[#4a4a4a]">Signed in as {user.email}</p>
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
            title: "Messages",
            description:
              "Message the CareBridge Connect team and read their replies.",
            cta: "Open messages",
          },
          {
            href: "/professional/onboarding/eligibility",
            title: "Onboarding",
            description:
              "Complete eligibility screening, competency assessment, profile details and document upload.",
            cta: "Continue onboarding",
          },
          {
            href: "/professional/roles",
            title: "Your roles",
            description:
              "See every role you work in, what each one is still waiting for, and apply for another.",
            cta: "Manage roles",
          },
          {
            href: "/professional/bookings",
            title: "Bookings",
            description:
              "Browse open shifts in your role and manage your accepted assignments.",
            cta: "View bookings",
          },
          {
            href: "/professional/earnings",
            title: "Earnings",
            description:
              "See payouts recorded for your completed bookings and your total paid to date.",
            cta: "View earnings",
          },
        ]}
      />
    </main>
  );
}
