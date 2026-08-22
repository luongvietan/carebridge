import { redirect } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/admin";
import { DatePicker } from "@/components/ui/date-picker";
import { formatAmountsByCurrency, formatMoney } from "@/lib/format/money";
import { londonDateRangeToUtc } from "@/lib/format/datetime";
import { Select } from "@/components/ui/select";
import { loadBookingFinance } from "@/lib/finance/load-bookings";
import { MONEY_STATE_HINT, MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    bookingStatus?: string;
    professionalId?: string;
    requesterUserId?: string;
  }>;
}) {
  if (!(await requireAdmin())) redirect("/login");
  const { from, to, bookingStatus, professionalId, requesterUserId } = await searchParams;
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

  const [{ data: payments }, { data: payouts }, { data: revenueRows }, bookingFinanceData] =
    await Promise.all([
      paymentsQuery,
      payoutsQuery,
      admin.from("v_platform_revenue").select("booking_id, platform_revenue, snap_currency"),
      loadBookingFinance(admin, { gte, lt, bookingStatus, professionalId, requesterUserId }),
    ]);
  const { rows: bookingRows, analytics, totalsByCurrency } = bookingFinanceData;
  const reportQuery = new URLSearchParams(
    Object.entries({ from, to, bookingStatus, professionalId, requesterUserId }).filter(
      (entry): entry is [string, string] => Boolean(entry[1]),
    ),
  ).toString();

  // Headline figures, one group per currency — euro is never summed into
  // pounds. "Total collected" is NET of refunds — a partial refund keeps the
  // payment `succeeded` but reduces the cash actually held.
  const succeededPayments = (payments ?? []).filter((p) => p.status === "succeeded");
  const addTo = (byCurrency: Record<string, number>, currency: string | null, value: number) => {
    byCurrency[currency ?? "GBP"] = (byCurrency[currency ?? "GBP"] ?? 0) + value;
  };

  const netCollectedByCurrency: Record<string, number> = {};
  for (const p of succeededPayments) {
    addTo(netCollectedByCurrency, p.currency, Number(p.amount) - Number(p.refunded_amount ?? 0));
  }

  const totalRefundedByCurrency: Record<string, number> = {};
  for (const p of payments ?? []) addTo(totalRefundedByCurrency, p.currency, Number(p.refunded_amount ?? 0));

  const totalPaidOutByCurrency: Record<string, number> = {};
  for (const p of (payouts ?? []).filter((x) => x.status === "paid")) {
    addTo(totalPaidOutByCurrency, p.currency, Number(p.amount));
  }

  // Platform revenue — v_platform_revenue rows for bookings with a succeeded payment.
  const succeededBookingIds = new Set<string>();
  for (const p of payments ?? []) {
    if (p.status === "succeeded") succeededBookingIds.add(p.booking_id);
  }
  const platformRevenueByCurrency: Record<string, number> = {};
  for (const r of revenueRows ?? []) {
    if (r.booking_id && succeededBookingIds.has(r.booking_id)) {
      addTo(platformRevenueByCurrency, r.snap_currency as string, Number(r.platform_revenue ?? 0));
    }
  }

  const totalsAsAmounts = (
    pick: (group: { charged: number; payout: number; fee: number; refunded: number }) => number,
  ): Record<string, number> =>
    Object.fromEntries(
      Object.entries(totalsByCurrency).map(([currency, group]) => [currency, pick(group)]),
    );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="mt-1 text-3xl font-bold">Finance</h1>
      </div>

      {/* Date filter */}
      <form method="GET" className="mt-6 flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-[#4a4a4a]">
          From
          <DatePicker name="from" aria-label="From date" defaultValue={from ?? ""} className="w-40" />
        </div>
        <div className="flex items-center gap-2 text-[#4a4a4a]">
          To
          <DatePicker name="to" aria-label="To date" defaultValue={to ?? ""} className="w-40" />
        </div>
        <div className="flex items-center gap-2 text-[#4a4a4a]">
          Booking status
          <Select
            name="bookingStatus"
            aria-label="Booking status"
            defaultValue={bookingStatus ?? ""}
            className="w-40"
            options={[
              { value: "", label: "Any" },
              { value: "open", label: "Open" },
              { value: "accepted", label: "Accepted" },
              { value: "assigned", label: "Assigned" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
              { value: "no_show", label: "No-show" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 text-[#4a4a4a]">
          Professional
          <Select
            name="professionalId"
            aria-label="Professional"
            defaultValue={professionalId ?? ""}
            className="w-48"
            options={[
              { value: "", label: "Any" },
              ...bookingFinanceData.professionals.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2 text-[#4a4a4a]">
          Client or organisation
          <Select
            name="requesterUserId"
            aria-label="Client or organisation"
            defaultValue={requesterUserId ?? ""}
            className="w-52"
            options={[
              { value: "", label: "Any" },
              ...bookingFinanceData.requesters.map((r) => ({
                value: r.userId,
                label: `${r.name} (${r.type === "client" ? "client" : "organisation"})`,
              })),
            ]}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-white hover:bg-[#246627]"
        >
          Filter
        </button>
        {(from || to) && (
          <Link href="/admin/finance" className="text-[#4a4a4a] underline hover:text-[#14301e]">
            Clear
          </Link>
        )}
      </form>

      {/* Headline cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#4a4a4a] uppercase">Net collected</p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(netCollectedByCurrency)}</p>
        </div>
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#4a4a4a] uppercase">Total refunded</p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(totalRefundedByCurrency)}</p>
        </div>
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#4a4a4a] uppercase">Total paid out</p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(totalPaidOutByCurrency)}</p>
        </div>
        <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-[#4a4a4a] uppercase">Platform revenue</p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(platformRevenueByCurrency)}</p>
        </div>
      </div>

      {/* Booking analytics */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Bookings, fees and payouts</h2>
          <Link
            href={`/admin/finance/report${reportQuery ? `?${reportQuery}` : ""}`}
            className="rounded-full border border-[#dbe7e0] px-3 py-1.5 text-sm text-[#2e7d32] hover:bg-[#f5f7f6]"
          >
            Printable report (PDF)
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#4a4a4a]">Completion rate</p>
            <p className="mt-2 text-2xl font-bold">{analytics.completionRate}%</p>
            <p className="mt-0.5 text-xs text-[#7a8a81]">
              {analytics.completed} of {analytics.concluded} concluded
            </p>
          </div>
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#4a4a4a]">Cancellation rate</p>
            <p className="mt-2 text-2xl font-bold">{analytics.cancellationRate}%</p>
            <p className="mt-0.5 text-xs text-[#7a8a81]">{analytics.noShow} no-shows</p>
          </div>
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#4a4a4a]">Average booking</p>
            <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(analytics.averageBookingValueByCurrency)}</p>
          </div>
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#4a4a4a]">Bookings this month</p>
            <p className="mt-2 text-2xl font-bold">{analytics.monthly.at(-1)?.bookings ?? 0}</p>
            <p className="mt-0.5 text-xs text-[#7a8a81]">
              {analytics.monthOnMonthGrowth === null
                ? "No prior month to compare"
                : `${analytics.monthOnMonthGrowth > 0 ? "+" : ""}${analytics.monthOnMonthGrowth}% on last month`}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
              <tr>
                <th className="p-3 font-medium">Shift</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Professional</th>
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">Charge</th>
                <th className="p-3 font-medium">Payout</th>
                <th className="p-3 font-medium">Platform fee</th>
                <th className="p-3 font-medium">Money</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7e0]">
              {bookingRows.map((row) => (
                <tr key={row.bookingId}>
                  <td className="p-3 whitespace-nowrap">{formatDate(row.scheduledStart)}</td>
                  <td className="p-3">{row.roleName ?? "—"}</td>
                  <td className="p-3">{row.professionalName ?? "—"}</td>
                  <td className="p-3">{row.requesterName ?? "—"}</td>
                  <td className="p-3">{formatMoney(row.clientCharge, row.currency)}</td>
                  <td className="p-3">{formatMoney(row.professionalPayout, row.currency)}</td>
                  <td className="p-3">{formatMoney(row.platformFee, row.currency)}</td>
                  <td className="p-3">
                    <span
                      title={MONEY_STATE_HINT[row.state]}
                      className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]"
                    >
                      {MONEY_STATE_LABEL[row.state]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {bookingRows.length > 0 && (
              <tfoot className="border-t border-[#dbe7e0] bg-[#f5f7f6] font-medium">
                <tr>
                  <td className="p-3" colSpan={4}>
                    {bookingRows.length} booking{bookingRows.length === 1 ? "" : "s"}
                  </td>
                  <td className="p-3">{formatAmountsByCurrency(totalsAsAmounts((t) => t.charged))}</td>
                  <td className="p-3">{formatAmountsByCurrency(totalsAsAmounts((t) => t.payout))}</td>
                  <td className="p-3">{formatAmountsByCurrency(totalsAsAmounts((t) => t.fee))}</td>
                  <td className="p-3" />
                </tr>
              </tfoot>
            )}
          </table>
          {bookingRows.length === 0 && (
            <p className="p-6 text-sm text-[#4a4a4a]">No bookings match these filters.</p>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[#dbe7e0] p-4">
          <p className="text-sm font-medium text-[#1e5a33]">Monthly trend</p>
          <ul className="mt-3 space-y-1.5 text-sm text-[#4a4a4a]">
            {analytics.monthly.map((point) => (
              <li key={point.month} className="flex items-center gap-3">
                <span className="w-20 shrink-0">{point.month}</span>
                <span
                  aria-hidden
                  className="h-2 rounded-full bg-[#6cc24a]"
                  style={{ width: `${Math.min(point.bookings * 24, 240)}px` }}
                />
                <span className="text-xs text-[#7a8a81]">
                  {point.bookings} booking{point.bookings === 1 ? "" : "s"} ·{" "}
                  {formatAmountsByCurrency(point.revenueByCurrency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Payments table */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Payments</h2>
        {payments && payments.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
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
                      <td className="p-3">{formatMoney(p.amount, p.currency)}</td>
                      <td className="p-3">{refunded > 0 ? formatMoney(refunded, p.currency) : "—"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
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
          <p className="mt-3 text-sm text-[#4a4a4a]">No payments.</p>
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
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
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
                      <td className="p-3">{formatMoney(p.amount, p.currency)}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-[#4a4a4a]">
                        {p.method && p.reference ? `${p.method} · ${p.reference}` : p.method ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#4a4a4a]">No payouts.</p>
        )}
      </section>
    </main>
  );
}
