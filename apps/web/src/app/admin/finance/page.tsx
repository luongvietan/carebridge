import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
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
  const t = await getPortalT();

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
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="mt-1 text-3xl font-bold"><Tr>{"Finance"}</Tr></h1>
      </div>

      {/* Date filter */}
      <form method="GET" className="mt-6 flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-ink"><Tr>{"From"}</Tr><DatePicker name="from" aria-label={t("From date")} defaultValue={from ?? ""} className="w-40" />
        </div>
        <div className="flex items-center gap-2 text-ink"><Tr>{"To"}</Tr><DatePicker name="to" aria-label={t("To date")} defaultValue={to ?? ""} className="w-40" />
        </div>
        <div className="flex items-center gap-2 text-ink"><Tr>{"Booking status"}</Tr><Select
            name="bookingStatus"
            aria-label={t("Booking status")}
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
        <div className="flex items-center gap-2 text-ink"><Tr>{"Professional"}</Tr><Select
            name="professionalId"
            aria-label={t("Professional")}
            defaultValue={professionalId ?? ""}
            className="w-48"
            options={[
              { value: "", label: "Any" },
              ...bookingFinanceData.professionals.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2 text-ink"><Tr>{"Client or organisation"}</Tr><Select
            name="requesterUserId"
            aria-label={t("Client or organisation")}
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
          className="rounded-full bg-brand-strong px-3 py-1.5 text-white hover:bg-brand-strong-hover"
        ><Tr>{"Filter"}</Tr></button>
        {(from || to) && (
          <Link href="/admin/finance" className="text-ink underline hover:text-heading"><Tr>{"Clear"}</Tr></Link>
        )}
      </form>

      {/* Headline cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Net collected"}</Tr></p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(netCollectedByCurrency)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Total refunded"}</Tr></p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(totalRefundedByCurrency)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Total paid out"}</Tr></p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(totalPaidOutByCurrency)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <p className="text-xs tracking-wide text-ink uppercase"><Tr>{"Platform revenue"}</Tr></p>
          <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(platformRevenueByCurrency)}</p>
        </div>
      </div>

      {/* Booking analytics */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold"><Tr>{"Bookings, fees and payouts"}</Tr></h2>
          <Link
            href={`/admin/finance/report${reportQuery ? `?${reportQuery}` : ""}`}
            className="rounded-full border border-line px-3 py-1.5 text-sm text-brand-strong hover:bg-surface"
          ><Tr>{"Printable report (PDF)"}</Tr></Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink"><Tr>{"Completion rate"}</Tr></p>
            <p className="mt-2 text-2xl font-bold">{analytics.completionRate}%</p>
            <p className="mt-0.5 text-xs text-muted">
              {analytics.completed}<Tr>{"of"}</Tr>{analytics.concluded}<Tr>{"concluded"}</Tr></p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink"><Tr>{"Cancellation rate"}</Tr></p>
            <p className="mt-2 text-2xl font-bold">{analytics.cancellationRate}%</p>
            <p className="mt-0.5 text-xs text-muted">{analytics.noShow}<Tr>{"no-shows"}</Tr></p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink"><Tr>{"Average booking"}</Tr></p>
            <p className="mt-2 text-2xl font-bold">{formatAmountsByCurrency(analytics.averageBookingValueByCurrency)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink"><Tr>{"Bookings this month"}</Tr></p>
            <p className="mt-2 text-2xl font-bold">{analytics.monthly.at(-1)?.bookings ?? 0}</p>
            <p className="mt-0.5 text-xs text-muted">
              {analytics.monthOnMonthGrowth === null
                ? "No prior month to compare"
                : `${analytics.monthOnMonthGrowth > 0 ? "+" : ""}${analytics.monthOnMonthGrowth}% on last month`}
            </p>
          </div>
        </div>

        <TableScroll className="mt-4 rounded-2xl border border-line">
          <table className="w-full text-sm">
            <AdminTableHeader>
              <tr>
                <th className="p-3 font-medium"><Tr>{"Shift"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Role"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Professional"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Client"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Charge"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Payout"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Platform fee"}</Tr></th>
                <th className="p-3 font-medium"><Tr>{"Money"}</Tr></th>
              </tr>
            </AdminTableHeader>
            <tbody className="divide-y divide-line">
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
                      className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink"
                    >
                      {MONEY_STATE_LABEL[row.state]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {bookingRows.length > 0 && (
              <tfoot className="border-t border-line bg-surface font-medium">
                <tr>
                  <td className="p-3" colSpan={4}>
                    {bookingRows.length}<Tr>{"booking"}</Tr><Tr>{bookingRows.length === 1 ? "" : "s"}</Tr>
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
            <p className="p-6 text-sm text-ink"><Tr>{"No bookings match these filters."}</Tr></p>
          )}
        </TableScroll>

        <div className="mt-4 rounded-2xl border border-line p-4">
          <p className="text-sm font-medium text-brand-ink"><Tr>{"Monthly trend"}</Tr></p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink">
            {analytics.monthly.map((point) => (
              <li key={point.month} className="flex items-center gap-3">
                <span className="w-20 shrink-0">{point.month}</span>
                <span
                  aria-hidden
                  className="h-2 rounded-full bg-[#6cc24a]"
                  style={{ width: `${Math.min(point.bookings * 24, 240)}px` }}
                />
                <span className="text-xs text-muted">
                  {point.bookings}<Tr>{"booking"}</Tr><Tr>{point.bookings === 1 ? "" : "s"}</Tr> ·{" "}
                  {formatAmountsByCurrency(point.revenueByCurrency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Payments table */}
      <section className="mt-10">
        <h2 className="text-xl font-bold"><Tr>{"Payments"}</Tr></h2>
        {payments && payments.length > 0 ? (
          <TableScroll className="mt-4 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <AdminTableHeader>
                <tr>
                  <th className="p-3 font-medium"><Tr>{"Date"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Booking start"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Amount"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Refunded"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Status"}</Tr></th>
                </tr>
              </AdminTableHeader>
              <tbody className="divide-y divide-line">
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
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"No payments."}</Tr></p>
        )}
      </section>

      {/* Payouts table */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold"><Tr>{"Payouts"}</Tr></h2>
          <Link
            href="/admin/finance/payouts"
            className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover"
          ><Tr>{"Manage payouts"}</Tr></Link>
        </div>
        {payouts && payouts.length > 0 ? (
          <TableScroll className="mt-4 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <table className="w-full text-sm">
              <AdminTableHeader>
                <tr>
                  <th className="p-3 font-medium"><Tr>{"Date"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Professional"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Amount"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Status"}</Tr></th>
                  <th className="p-3 font-medium"><Tr>{"Method / Ref"}</Tr></th>
                </tr>
              </AdminTableHeader>
              <tbody className="divide-y divide-line">
                {payouts.map((p) => {
                  const prof = p.professionals as { full_name: string } | null;
                  return (
                    <tr key={p.id}>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                      <td className="p-3">{prof?.full_name ?? "—"}</td>
                      <td className="p-3">{formatMoney(p.amount, p.currency)}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-ink">
                        {p.method && p.reference ? `${p.method} · ${p.reference}` : p.method ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          <p className="mt-3 text-sm text-ink"><Tr>{"No payouts."}</Tr></p>
        )}
      </section>
    </main>
  );
}
