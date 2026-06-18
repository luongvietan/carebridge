import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatGbpMoney } from "@/lib/format/money";
import { formatLondon } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-[#defbe6] text-[#0e6027]",
  recorded: "bg-[#fcf4d6] text-[#684e1b]",
};

/**
 * Spec §8 — professional payout / transaction history. A professional can see
 * every payout recorded for their completed bookings (status, net amount,
 * method, reference and dates), scoped strictly to their own professional id.
 */
export default async function ProfessionalEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createServiceClient();
  const { data: prof } = user
    ? await admin.from("professionals").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };

  const { data: payouts } = prof
    ? await admin
        .from("payouts")
        .select("id, booking_id, amount, currency, status, method, reference, recorded_at, paid_at")
        .eq("professional_id", prof.id)
        .order("recorded_at", { ascending: false })
    : { data: [] };

  const rows = payouts ?? [];
  const totalPaid = rows
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Earnings</h1>
      <p className="mt-2 text-sm text-[#5b6a62]">
        Payouts recorded for your completed bookings. Amounts are net of any client refunds.
      </p>

      <div className="mt-6 rounded-2xl border border-[#dbe7e0] bg-[#f5f7f6] px-5 py-4">
        <span className="text-sm text-[#5b6a62]">Total paid to date</span>
        <p className="text-2xl font-bold text-[#14301e]">{formatGbpMoney(totalPaid)}</p>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
            <tr>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Method</th>
              <th className="p-3 font-medium">Reference</th>
              <th className="p-3 font-medium">Recorded</th>
              <th className="p-3 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7e0]">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-medium">{formatGbpMoney(Number(p.amount))}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? "bg-[#f5f7f6] text-[#5b6a62]"}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="p-3">{p.method ? p.method.replace(/_/g, " ") : "—"}</td>
                <td className="p-3">{p.reference ?? "—"}</td>
                <td className="p-3 text-[#5b6a62]">{p.recorded_at ? formatLondon(p.recorded_at) : "—"}</td>
                <td className="p-3 text-[#5b6a62]">{p.paid_at ? formatLondon(p.paid_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-sm text-[#5b6a62]">
            No payouts yet. Payouts appear here once an administrator records payment for a completed
            booking.
          </p>
        )}
      </div>
    </main>
  );
}
