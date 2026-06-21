import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";

export default async function OrganisationHome() {
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
            href: "/organisation/register",
            title: "Your profile",
            description: "Set up organisation details, contacts and billing information.",
            cta: "Manage profile",
          },
          {
            href: "/organisation/bookings",
            title: "Bookings",
            description: "Request staff cover and manage bookings across your sites.",
            cta: "View bookings",
          },
        ]}
      />
    </main>
  );
}
