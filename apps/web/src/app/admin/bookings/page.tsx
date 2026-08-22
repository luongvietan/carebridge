import { createServiceClient } from "@/lib/supabase/service";
import { AdminBookings } from "@/components/admin-bookings";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const admin = createServiceClient();
  const [{ data: bookings }, { data: pros }, { data: assignments }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, status, booking_type, scheduled_start, professional_role_id, assigned_professional_id, professional_roles(name), care_types(name), total_client_charge",
      )
      .order("scheduled_start", { ascending: false }),
    admin
      .from("professionals")
      .select("id, full_name, professional_role_id, can_accept_bookings")
      .eq("can_accept_bookings", true),
    // A professional may be cleared for several roles; the assign control offers
    // them for every role they actually hold, not only their main one.
    admin
      .from("professional_role_assignments")
      .select("professional_id, professional_role_id")
      .eq("status", "active"),
  ]);

  const rolesByProfessional = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    const list = rolesByProfessional.get(a.professional_id) ?? [];
    list.push(a.professional_role_id);
    rolesByProfessional.set(a.professional_id, list);
  }
  const professionals = (pros ?? []).map((p) => ({
    ...p,
    activeRoleIds: rolesByProfessional.get(p.id) ?? [],
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Bookings</h1>
      <AdminBookings bookings={bookings ?? []} professionals={professionals} />
    </main>
  );
}
