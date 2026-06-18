import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { RecordPayoutButton, MarkPayoutPaidForm } from "@/components/payout-actions";
import { formatGbpMoney } from "@/lib/format/money";
import { netPayoutAmount } from "@/lib/payouts/record";

export const dynamic = "force-dynamic";

function formatMoney(amount: number | null | undefined) {
  return formatGbpMoney(amount);
}

export default async function AdminPayoutsPage() {
  if (!(await requireAdmin())) redirect("/login");
  const admin = createServiceClient();

  // 1. Completed bookings with a succeeded payment and NO payout yet.
  const { data: completedBookings } = await admin
    .from("bookings")
    .select("id, scheduled_start, total_payout, assigned_professional_id, professionals(id, full_name)")
    .eq("status", "completed")
    .not("assigned_professional_id", "is", null)
    .order("scheduled_start", { ascending: false });

  // Filter to those with a succeeded payment, and track partial refunds so the
  // displayed payout matches what recordPayout will actually record (total_payout
  // minus refunds). Fully-refunded payments flip to status 'refunded' and so are
  // naturally excluded from the succeeded set.
  const completedIds = (completedBookings ?? []).map((b) => b.id);
  let succeededBookingIds = new Set<string>();
  const refundedByBooking = new Map<string, number>();
  if (completedIds.length > 0) {
    const { data: paidPayments } = await admin
      .from("payments")
      .select("booking_id, refunded_amount")
      .in("booking_id", completedIds)
      .eq("status", "succeeded");
    succeededBookingIds = new Set((paidPayments ?? []).map((p) => p.booking_id));
    for (const p of paidPayments ?? []) {
      if (!p.booking_id) continue;
      refundedByBooking.set(
        p.booking_id,
        (refundedByBooking.get(p.booking_id) ?? 0) + Number(p.refunded_amount ?? 0),
      );
    }
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
  await Promise.all(
    profIds.map(async (profId) => {
      const { data } = await admin.rpc("get_payout_last4", { p_professional_id: profId });
      last4Map.set(profId, (data as string | null) ?? null);
    }),
  );

  // 2. Recorded payouts (status = 'recorded') → "Mark paid".
  const { data: recordedPayouts } = await admin
    .from("payouts")
    .select("id, booking_id, amount, currency, professionals(id, full_name)")
    .eq("status", "recorded")
    .order("created_at", { ascending: false });

  // Fetch last4 for recorded payout professionals too.
  const recordedProfIds = new Set<string>();
  for (const p of recordedPayouts ?? []) {
    const id = (p.professionals as { id: string; full_name: string } | null)?.id;
    if (id) recordedProfIds.add(id);
  }
  const missingProfIds: string[] = [];
  for (const profId of recordedProfIds) {
    if (!last4Map.has(profId)) missingProfIds.push(profId);
  }
  await Promise.all(
    missingProfIds.map(async (profId) => {
        const { data } = await admin.rpc("get_payout_last4", { p_professional_id: profId });
        last4Map.set(profId, (data as string | null) ?? null);
      }),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold">Payouts</h1>
        </div>
        <BackLink
          href="/admin/finance"
          className="rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm text-[#1e5a33] hover:bg-[#f5f7f6]"
        >
          Finance overview
        </BackLink>
      </div>

      {/* Bookings awaiting payout */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Awaiting payout</h2>
        {pendingPayout.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                <tr>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Account last 4</th>
                  <th className="p-3 font-medium">Payout amount</th>
                  <th scope="col" className="p-3 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {pendingPayout.map((b) => {
                  const prof = b.professionals as { id: string; full_name: string } | null;
                  const last4 = b.assigned_professional_id
                    ? (last4Map.get(b.assigned_professional_id) ?? null)
                    : null;
                  const refunded = refundedByBooking.get(b.id) ?? 0;
                  const net = netPayoutAmount(Number(b.total_payout), refunded);
                  return (
                    <tr key={b.id}>
                      <td className="p-3">{prof?.full_name ?? "—"}</td>
                      <td className="p-3">{last4 ? `****${last4}` : "—"}</td>
                      <td className="p-3">
                        {formatMoney(net)}
                        {refunded > 0 && (
                          <span className="block text-xs text-[#684e1b]">
                            after {formatMoney(refunded)} refund (of {formatMoney(b.total_payout)})
                          </span>
                        )}
                      </td>
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
          <p className="mt-3 text-sm text-[#5b6a62]">No bookings awaiting payout.</p>
        )}
      </section>

      {/* Recorded payouts → Mark paid */}
      <section className="mt-12">
        <h2 className="text-xl font-bold">Recorded — awaiting bank transfer</h2>
        {recordedPayouts && recordedPayouts.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                <tr>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Account last 4</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Mark paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
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
          <p className="mt-3 text-sm text-[#5b6a62]">No recorded payouts awaiting payment.</p>
        )}
      </section>
    </main>
  );
}
