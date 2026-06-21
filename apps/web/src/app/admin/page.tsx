import { DashboardGrid } from "@/components/dashboard-grid";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHome() {
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
            href: "/admin/users",
            title: "Users",
            description: "Search and manage professionals, status actions and compliance filters.",
            cta: "Manage users",
          },
          {
            href: "/admin/accounts",
            title: "All accounts",
            description: "Suspend or deactivate any account role across the platform.",
            cta: "Manage accounts",
          },
          {
            href: "/admin/rates",
            title: "Rate cards",
            description: "View and amend effective-dated rate cards by professional role.",
            cta: "Manage rate cards",
          },
          {
            href: "/admin/finance",
            title: "Finance",
            description: "Review transactions, payments and revenue across bookings.",
            cta: "Open finance",
          },
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
