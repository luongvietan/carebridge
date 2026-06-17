import { createServiceClient } from "@/lib/supabase/service";
import { AdminBookings } from "@/components/admin-bookings";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const admin = createServiceClient();
  const [{ data: bookings }, { data: pros }] = await Promise.all([
    admin
      .from("bookings")
      .select(
        "id, status, booking_type, scheduled_start, professional_role_id, assigned_professional_id, professional_roles(name), total_client_charge",
      )
      .order("scheduled_start", { ascending: false }),
    admin
      .from("professionals")
      .select("id, full_name, professional_role_id, can_accept_bookings")
      .eq("can_accept_bookings", true),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Bookings</h1>
      <AdminBookings bookings={bookings ?? []} professionals={pros ?? []} />
    </main>
  );
}
