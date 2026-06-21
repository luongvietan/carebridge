import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";

export default async function ProfessionalHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
      {user?.email && <p className="mt-2 text-sm text-[#4a4a4a]">Signed in as {user.email}</p>}

      <DashboardGrid
        cards={[
          {
            href: "/professional/onboarding/eligibility",
            title: "Onboarding",
            description:
              "Complete eligibility screening, competency assessment, profile details and document upload.",
            cta: "Continue onboarding",
          },
          {
            href: "/professional/bookings",
            title: "Bookings",
            description: "Browse open shifts in your role and manage your accepted assignments.",
            cta: "View bookings",
          },
          {
            href: "/professional/earnings",
            title: "Earnings",
            description: "See payouts recorded for your completed bookings and your total paid to date.",
            cta: "View earnings",
          },
        ]}
      />
    </main>
  );
}
