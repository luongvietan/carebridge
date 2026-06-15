import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(amount));
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!(await requireAdmin())) redirect("/login");
  const { from, to } = await searchParams;
  const admin = createServiceClient();

  // Payments — join bookings(id, scheduled_start) and payer.
  let paymentsQuery = admin
    .from("payments")
    .select("id, booking_id, amount, currency, status, created_at, payer_user_id, bookings(id, scheduled_start)")
    .order("created_at", { ascending: false });
  if (from) paymentsQuery = paymentsQuery.gte("created_at", from);
  if (to) paymentsQuery = paymentsQuery.lte("created_at", to + "T23:59:59Z");
  const { data: payments } = await paymentsQuery;

  // Payouts — join professionals(full_name).
  let payoutsQuery = admin
    .from("payouts")
    .select("id, booking_id, amount, currency, status, created_at, method, reference, professionals(full_name)")
    .order("created_at", { ascending: false });
  if (from) payoutsQuery = payoutsQuery.gte("created_at", from);
  if (to) payoutsQuery = payoutsQuery.lte("created_at", to + "T23:59:59Z");
  const { data: payouts } = await payoutsQuery;

  // Platform revenue view — for bookings with succeeded payment.
  const { data: revenueRows } = await admin
    .from("v_platform_revenue")
    .select("booking_id, platform_revenue");

  // Headline figures.
  const totalCollected = (payments ?? [])
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPaidOut = (payouts ?? [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Platform revenue — sum v_platform_revenue for bookings that have a succeeded payment.
  const succeededBookingIds = new Set(
    (payments ?? []).filter((p) => p.status === "succeeded").map((p) => p.booking_id),
  );
  const platformRevenue = (revenueRows ?? [])
    .filter((r) => r.booking_id && succeededBookingIds.has(r.booking_id))
    .reduce((sum, r) => sum + Number(r.platform_revenue ?? 0), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <p className="text-sm tracking-wide text-[#525252] uppercase">Admin</p>
        <h1 className="mt-1 text-3xl font-light">Finance</h1>
      </div>

      {/* Date filter */}
      <form method="GET" className="mt-6 flex items-center gap-3 text-sm">
        <label className="flex items-center gap-1 text-[#525252]">
          From
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="ml-1 border-b border-[#8c8c8c] bg-transparent px-1 py-0.5 focus:border-[#198038] focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1 text-[#525252]">
          To
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="ml-1 border-b border-[#8c8c8c] bg-transparent px-1 py-0.5 focus:border-[#198038] focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="bg-[#198038] px-3 py-1.5 text-white hover:bg-[#0e6027]"
        >
          Filter
        </button>
        {(from || to) && (
          <a href="/admin/finance" className="text-[#525252] underline hover:text-[#161616]">
            Clear
          </a>
        )}
      </form>

      {/* Headline cards */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="border border-[#e0e0e0] p-4">
          <p className="text-xs tracking-wide text-[#525252] uppercase">Total collected</p>
          <p className="mt-2 text-2xl font-light">{formatMoney(totalCollected)}</p>
        </div>
        <div className="border border-[#e0e0e0] p-4">
          <p className="text-xs tracking-wide text-[#525252] uppercase">Total paid out</p>
          <p className="mt-2 text-2xl font-light">{formatMoney(totalPaidOut)}</p>
        </div>
        <div className="border border-[#e0e0e0] p-4">
          <p className="text-xs tracking-wide text-[#525252] uppercase">Platform revenue</p>
          <p className="mt-2 text-2xl font-light">{formatMoney(platformRevenue)}</p>
        </div>
      </div>

      {/* Payments table */}
      <section className="mt-10">
        <h2 className="text-xl font-light">Payments</h2>
        {payments && payments.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Booking start</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {payments.map((p) => {
                  const booking = p.bookings as { id: string; scheduled_start: string } | null;
                  return (
                    <tr key={p.id}>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                      <td className="p-3">
                        {booking?.scheduled_start ? formatDate(booking.scheduled_start) : "—"}
                      </td>
                      <td className="p-3">{formatMoney(p.amount)}</td>
                      <td className="p-3">
                        <span className="bg-[#f4f4f4] px-2 py-0.5 text-xs text-[#525252]">
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
          <p className="mt-3 text-sm text-[#525252]">No payments.</p>
        )}
      </section>

      {/* Payouts table */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light">Payouts</h2>
          <a
            href="/admin/finance/payouts"
            className="bg-[#198038] px-3 py-1.5 text-sm text-white hover:bg-[#0e6027]"
          >
            Manage payouts
          </a>
        </div>
        {payouts && payouts.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
                <tr>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Method / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {payouts.map((p) => {
                  const prof = p.professionals as { full_name: string } | null;
                  return (
                    <tr key={p.id}>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                      <td className="p-3">{prof?.full_name ?? "—"}</td>
                      <td className="p-3">{formatMoney(p.amount)}</td>
                      <td className="p-3">
                        <span className="bg-[#f4f4f4] px-2 py-0.5 text-xs text-[#525252]">
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-[#525252]">
                        {p.method && p.reference ? `${p.method} · ${p.reference}` : p.method ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#525252]">No payouts.</p>
        )}
      </section>
    </main>
  );
}
