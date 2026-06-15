import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";

export default async function ClientHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm tracking-wide text-[#525252] uppercase">Private client</p>
      <h1 className="mt-1 text-3xl font-light">Dashboard</h1>
      {user?.email && <p className="mt-2 text-sm text-[#525252]">Signed in as {user.email}</p>}

      <DashboardGrid
        cards={[
          {
            href: "/client/register",
            title: "Your profile",
            description: "Register your care requirements, address and billing details.",
            cta: "Manage profile",
          },
          {
            href: "/client/bookings",
            title: "Bookings",
            description: "Request care sessions and track the status of your bookings.",
            cta: "View bookings",
          },
        ]}
      />
    </main>
  );
}
