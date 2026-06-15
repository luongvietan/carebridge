import { createServiceClient } from "@/lib/supabase/service";
import { RecordPayoutButton, MarkPayoutPaidForm } from "@/components/payout-actions";

export const dynamic = "force-dynamic";

function formatMoney(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(amount));
}

export default async function AdminPayoutsPage() {
  const admin = createServiceClient();

  // 1. Completed bookings with a succeeded payment and NO payout yet.
  const { data: completedBookings } = await admin
    .from("bookings")
    .select("id, scheduled_start, total_payout, assigned_professional_id, professionals(id, full_name)")
    .eq("status", "completed")
    .not("assigned_professional_id", "is", null)
    .order("scheduled_start", { ascending: false });

  // Filter to those with a succeeded payment.
  const completedIds = (completedBookings ?? []).map((b) => b.id);
  let succeededBookingIds = new Set<string>();
  if (completedIds.length > 0) {
    const { data: paidPayments } = await admin
      .from("payments")
      .select("booking_id")
      .in("booking_id", completedIds)
      .eq("status", "succeeded");
    succeededBookingIds = new Set((paidPayments ?? []).map((p) => p.booking_id));
  }

  // Filter to those with NO payout.
  let payoutedBookingIds = new Set<string>();
  if (completedIds.length > 0) {
    const { data: existingPayouts } = await admin
      .from("payouts")
      .select("booking_id")
      .in("booking_id", completedIds)
      .not("booking_id", "is", null);
    payoutedBookingIds = new Set(
      (existingPayouts ?? []).map((p) => p.booking_id).filter((id): id is string => id !== null),
    );
  }

  const pendingPayout = (completedBookings ?? []).filter(
    (b) => succeededBookingIds.has(b.id) && !payoutedBookingIds.has(b.id),
  );

  // Fetch last4 for each professional in pendingPayout.
  const profIds = [
    ...new Set(
      pendingPayout
        .map((b) => b.assigned_professional_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  const last4Map = new Map<string, string | null>();
  for (const profId of profIds) {
    const { data } = await admin.rpc("get_payout_last4", { p_professional_id: profId });
    last4Map.set(profId, (data as string | null) ?? null);
  }

  // 2. Recorded payouts (status = 'recorded') → "Mark paid".
  const { data: recordedPayouts } = await admin
    .from("payouts")
    .select("id, booking_id, amount, currency, professionals(id, full_name)")
    .eq("status", "recorded")
    .order("created_at", { ascending: false });

  // Fetch last4 for recorded payout professionals too.
  const recordedProfIds = [
    ...new Set(
      (recordedPayouts ?? [])
        .map((p) => (p.professionals as { id: string; full_name: string } | null)?.id)
        .filter((id): id is string => !!id),
    ),
  ];
  for (const profId of recordedProfIds) {
    if (!last4Map.has(profId)) {
      const { data } = await admin.rpc("get_payout_last4", { p_professional_id: profId });
      last4Map.set(profId, (data as string | null) ?? null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-[#525252] uppercase">Admin · Finance</p>
          <h1 className="mt-1 text-3xl font-light">Payouts</h1>
        </div>
        <a
          href="/admin/finance"
          className="border border-[#8c8c8c] px-3 py-1.5 text-sm hover:bg-[#f4f4f4]"
        >
          ← Finance overview
        </a>
      </div>

      {/* Bookings awaiting payout */}
      <section className="mt-10">
        <h2 className="text-xl font-light">Awaiting payout</h2>
        {pendingPayout.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
                <tr>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Account last 4</th>
                  <th className="p-3 font-medium">Payout amount</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {pendingPayout.map((b) => {
                  const prof = b.professionals as { id: string; full_name: string } | null;
                  const last4 = b.assigned_professional_id
                    ? (last4Map.get(b.assigned_professional_id) ?? null)
                    : null;
                  return (
                    <tr key={b.id}>
                      <td className="p-3">{prof?.full_name ?? "—"}</td>
                      <td className="p-3">{last4 ? `****${last4}` : "—"}</td>
                      <td className="p-3">{formatMoney(b.total_payout)}</td>
                      <td className="p-3 text-right">
                        <RecordPayoutButton bookingId={b.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#525252]">No bookings awaiting payout.</p>
        )}
      </section>

      {/* Recorded payouts → Mark paid */}
      <section className="mt-12">
        <h2 className="text-xl font-light">Recorded — awaiting bank transfer</h2>
        {recordedPayouts && recordedPayouts.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
                <tr>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Account last 4</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Mark paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {recordedPayouts.map((p) => {
                  const prof = p.professionals as { id: string; full_name: string } | null;
                  const last4 = prof ? (last4Map.get(prof.id) ?? null) : null;
                  return (
                    <tr key={p.id}>
                      <td className="p-3">{prof?.full_name ?? "—"}</td>
                      <td className="p-3">{last4 ? `****${last4}` : "—"}</td>
                      <td className="p-3">{formatMoney(p.amount)}</td>
                      <td className="p-3">
                        <MarkPayoutPaidForm payoutId={p.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#525252]">No recorded payouts awaiting payment.</p>
        )}
      </section>
    </main>
  );
}
