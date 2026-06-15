import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm tracking-wide text-[#525252] uppercase">Admin</p>
      <h1 className="mt-1 text-3xl font-light">Dashboard</h1>
      {user?.email && <p className="mt-2 text-sm text-[#525252]">Signed in as {user.email}</p>}

      <DashboardGrid
        cards={[
          {
            href: "/admin/compliance",
            title: "Compliance",
            description: "Review professional documents, expiry alerts and verification status.",
            cta: "Open compliance",
          },
          {
            href: "/admin/bookings",
            title: "Bookings",
            description: "Assign professionals to open bookings and oversee the full booking pipeline.",
            cta: "Manage bookings",
          },
        ]}
      />
    </main>
  );
}
