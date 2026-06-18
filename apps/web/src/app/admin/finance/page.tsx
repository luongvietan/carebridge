import { redirect } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { DatePicker } from "@/components/ui/date-picker";
import { formatGbpMoney } from "@/lib/format/money";
import { londonDateRangeToUtc } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(amount: number | null | undefined) {
  return formatGbpMoney(amount);
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!(await requireAdmin())) redirect("/login");
  const { from, to } = await searchParams;
  const admin = createServiceClient();

  // London calendar dates → half-open UTC instant bounds (BST-safe; includes the
  // whole of the `to` day).
  const { gte, lt } = londonDateRangeToUtc(from, to);

  // Payments — join bookings(id, scheduled_start) and payer.
  let paymentsQuery = admin
    .from("payments")
    .select("id, booking_id, amount, refunded_amount, currency, status, created_at, payer_user_id, bookings(id, scheduled_start)")
    .order("created_at", { ascending: false });
  if (gte) paymentsQuery = paymentsQuery.gte("created_at", gte);
  if (lt) paymentsQuery = paymentsQuery.lt("created_at", lt);

  let payoutsQuery = admin
    .from("payouts")
    .select("id, booking_id, amount, currency, status, created_at, method, reference, professionals(full_name)")
    .order("created_at", { ascending: false });
  if (gte) payoutsQuery = payoutsQuery.gte("created_at", gte);
  if (lt) payoutsQuery = payoutsQuery.lt("created_at", lt);

  const [{ data: payments }, { data: payouts }, { data: revenueRows }] = await Promise.all([
    paymentsQuery,
    payoutsQuery,
    admin.from("v_platform_revenue").select("booking_id, platform_revenue"),
  ]);

  // Headline figures. "Total collected" is NET of refunds — a partial refund
  // keeps the payment `succeeded` but reduces the cash actually held.
  const succeededPayments = (payments ?? []).filter((p) => p.status === "succeeded");
  const totalRefunded = (payments ?? []).reduce((sum, p) => sum + Number(p.refunded_amount ?? 0), 0);
  const totalCollected = succeededPayments.reduce(
    (sum, p) => sum + Number(p.amount) - Number(p.refunded_amount ?? 0),
    0,
  );

  const totalPaidOut = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Platform revenue — sum v_platform_revenue for bookings that have a succeeded payment.
  const succeededBookingIds = new Set<string>();
  for (const p of payments ?? []) {
    if (p.status === "succeeded") succeededBookingIds.add(p.booking_id);
  }
  const platformRevenue = (revenueRows ?? [])
    .filter((r) => r.booking_id && succeededBookingIds.has(r.booking_id))
    .reduce((sum, r) => sum + Number(r.platform_revenue ?? 0), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="mt-1 text-3xl font-bold">Finance</h1>
      </div>

      {/* Date filter */}
      <form method="GET" className="mt-6 flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-[#5b6a62]">
          From
          <DatePicker name="from" aria-label="From date" defaultValue={from ?? ""} className="w-40" />
        </div>
        <div className="flex items-center gap-2 text-[#5b6a62]">
          To
          <DatePicker name="to" aria-label="To date" defaultValue={to ?? ""} className="w-40" />
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-white hover:bg-[#246627]"
        >
          Filter
        </button>
        {(from || to) && (
          <Link href="/admin/finance" className="text-[#5b6a62] underline hover:text-[#14301e]">
            Clear
          </Link>
        )}
      </form>

      {/* Headline cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Net collected</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(totalCollected)}</p>
        </div>
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Total refunded</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(totalRefunded)}</p>
        </div>
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Total paid out</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(totalPaidOut)}</p>
        </div>
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#5b6a62] uppercase">Platform revenue</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(platformRevenue)}</p>
        </div>
      </div>

      {/* Payments table */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Payments</h2>
        {payments && payments.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Booking start</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Refunded</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {payments.map((p) => {
                  const booking = p.bookings as { id: string; scheduled_start: string } | null;
                  const refunded = Number(p.refunded_amount ?? 0);
                  return (
                    <tr key={p.id}>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                      <td className="p-3">
                        {booking?.scheduled_start ? formatDate(booking.scheduled_start) : "—"}
                      </td>
                      <td className="p-3">{formatMoney(p.amount)}</td>
                      <td className="p-3">{refunded > 0 ? formatMoney(refunded) : "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#5b6a62]">
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5b6a62]">No payments.</p>
        )}
      </section>

      {/* Payouts table */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Payouts</h2>
          <Link
            href="/admin/finance/payouts"
            className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-sm text-white hover:bg-[#246627]"
          >
            Manage payouts
          </Link>
        </div>
        {payouts && payouts.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Method / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {payouts.map((p) => {
                  const prof = p.professionals as { full_name: string } | null;
                  return (
                    <tr key={p.id}>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                      <td className="p-3">{prof?.full_name ?? "—"}</td>
                      <td className="p-3">{formatMoney(p.amount)}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#5b6a62]">
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-[#5b6a62]">
                        {p.method && p.reference ? `${p.method} · ${p.reference}` : p.method ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5b6a62]">No payouts.</p>
        )}
      </section>
    </main>
  );
}
