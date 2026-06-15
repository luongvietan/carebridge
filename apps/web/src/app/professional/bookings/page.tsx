import { createClient } from "@/lib/supabase/server";
import { ProfessionalBookings } from "@/components/professional-bookings";

export const dynamic = "force-dynamic";

export default async function ProfessionalBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: prof } = user
    ? await supabase
        .from("professionals")
        .select("id, professional_role_id, can_accept_bookings")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: declines } = await supabase.from("booking_declines").select("booking_id");
  const declined = new Set((declines ?? []).map((d) => d.booking_id));

  const { data: rows } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_start, scheduled_end, location_address, professional_role_id, assigned_professional_id, total_payout",
    )
    .order("scheduled_start", { ascending: true });

  const roleId = prof?.professional_role_id ?? null;
  const open = (rows ?? []).filter(
    (b) => b.status === "open" && b.professional_role_id === roleId && !declined.has(b.id),
  );
  const mine = (rows ?? []).filter((b) => b.assigned_professional_id === prof?.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm tracking-wide text-[#525252] uppercase">Professional</p>
      <h1 className="mt-1 text-3xl font-light">Bookings</h1>
      <div className="mt-10">
        <ProfessionalBookings open={open} mine={mine} eligible={!!prof?.can_accept_bookings} />
      </div>
    </main>
  );
}
