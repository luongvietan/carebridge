import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { activeRoleIds } from "@/lib/roles/assignments";
import { ProfessionalBookings } from "@/components/professional-bookings";
import { SubmitHoursForm, type ShiftAwaitingHours } from "@/components/timesheet-forms";

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

  const { data: declines } = prof
    ? await supabase.from("booking_declines").select("booking_id").eq("professional_id", prof.id)
    : { data: [] };
  const declined = new Set((declines ?? []).map((d) => d.booking_id));

  const { data: rows } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_start, scheduled_end, location_address, professional_role_id, assigned_professional_id, total_payout, requires_timesheet, care_types(name)",
    )
    .order("scheduled_start", { ascending: true });

  // Every role the professional is currently cleared for, not just their main
  // one: a nurse who also childminds sees both kinds of open shift.
  const myRoles = prof ? new Set(await activeRoleIds(createServiceClient(), prof.id)) : new Set<string>();

  // Only future, role-matching open bookings are acceptable — a past-start
  // booking can never be accepted (the server + DB trigger reject it).
  const now = Date.now();
  const forMyRole = (rows ?? []).filter(
    (b) =>
      b.status === "open" &&
      myRoles.has(b.professional_role_id) &&
      new Date(b.scheduled_start).getTime() > now,
  );
  const open = forMyRole.filter((b) => !declined.has(b.id));
  const declinedOpen = forMyRole.filter((b) => declined.has(b.id));
  const mine = (rows ?? []).filter((b) => b.assigned_professional_id === prof?.id);

  // Completed shifts still needing hours: none submitted, or a submission the
  // client has queried and sent back for correction.
  const completedMine = mine.filter((b) => b.status === "completed" && b.requires_timesheet);
  const { data: sheets } = prof
    ? await supabase
        .from("timesheets")
        .select("booking_id, status, dispute_reason")
        .eq("professional_id", prof.id)
    : { data: [] };
  const sheetByBooking = new Map((sheets ?? []).map((t) => [t.booking_id, t]));
  const awaitingHours: ShiftAwaitingHours[] = completedMine
    .filter((b) => {
      const sheet = sheetByBooking.get(b.id);
      return !sheet || sheet.status === "disputed";
    })
    .map((b) => ({
      bookingId: b.id,
      scheduledStart: b.scheduled_start,
      scheduledEnd: b.scheduled_end,
      locationAddress: b.location_address,
      disputeReason: sheetByBooking.get(b.id)?.dispute_reason ?? null,
    }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Bookings</h1>
      {awaitingHours.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Hours to submit</h2>
          <p className="mt-2 text-sm text-[#4a4a4a]">
            Log the hours you actually worked. Your payment is released once the client confirms
            them, and automatically after three working days if they do not respond.
          </p>
          <div className="mt-4 divide-y divide-[#dbe7e0] border border-[#dbe7e0]">
            {awaitingHours.map((shift) => (
              <SubmitHoursForm key={shift.bookingId} shift={shift} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <ProfessionalBookings
          open={open}
          mine={mine}
          declined={declinedOpen}
          eligible={!!prof?.can_accept_bookings}
        />
      </div>
    </main>
  );
}
