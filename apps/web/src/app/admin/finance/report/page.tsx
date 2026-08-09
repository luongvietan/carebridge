import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PrintButton } from "@/components/print-button";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatGbpMoney } from "@/lib/format/money";
import { londonDateRangeToUtc, formatLondon } from "@/lib/format/datetime";
import { loadBookingFinance } from "@/lib/finance/load-bookings";
import { MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";

export const dynamic = "force-dynamic";

/**
 * A print-ready finance report — the client asked for a PDF export alongside CSV
 * and Excel. Rendered as a page the browser prints to PDF rather than generated
 * server-side with a PDF library, which is how the competency certificate
 * already works: no new dependency, and the output is a real PDF with the
 * platform's own typography.
 */
export default async function FinanceReportPage({
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
  const { gte, lt } = londonDateRangeToUtc(from, to);

  const { rows, analytics, totals } = await loadBookingFinance(admin, {
    gte,
    lt,
    bookingStatus,
    professionalId,
    requesterUserId,
  });

  const period =
    from || to ? `${from ?? "the beginning"} to ${to ?? "today"}` : "all bookings to date";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <BackLink href="/admin/finance">Back to finance</BackLink>
      </div>

      <header className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e5a33]">CareBridge Connect — finance report</h1>
          <p className="mt-1 text-sm text-[#4a4a4a]">
            {period} · generated {formatLondon(new Date().toISOString())}
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton
            label="Save as PDF"
            className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627]"
          />
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label="Bookings" value={String(rows.length)} />
        <Figure label="Client charges" value={formatGbpMoney(totals.charged)} />
        <Figure label="Professional payouts" value={formatGbpMoney(totals.payout)} />
        <Figure label="Platform fees" value={formatGbpMoney(totals.fee)} />
        <Figure label="Refunded" value={formatGbpMoney(totals.refunded)} />
        <Figure label="Completion rate" value={`${analytics.completionRate}%`} />
        <Figure label="Cancellation rate" value={`${analytics.cancellationRate}%`} />
        <Figure label="Average booking" value={formatGbpMoney(analytics.averageBookingValue)} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[#1e5a33]">Bookings</h2>
        <table className="mt-3 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1e5a33] text-left">
              <th className="py-2 pr-3 font-semibold">Shift</th>
              <th className="py-2 pr-3 font-semibold">Role</th>
              <th className="py-2 pr-3 font-semibold">Professional</th>
              <th className="py-2 pr-3 font-semibold">Client</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 text-right font-semibold">Charge</th>
              <th className="py-2 pr-3 text-right font-semibold">Payout</th>
              <th className="py-2 text-right font-semibold">Fee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bookingId} className="border-b border-[#dbe7e0]">
                <td className="py-1.5 pr-3 whitespace-nowrap">{formatLondon(row.scheduledStart)}</td>
                <td className="py-1.5 pr-3">{row.roleName ?? "—"}</td>
                <td className="py-1.5 pr-3">{row.professionalName ?? "—"}</td>
                <td className="py-1.5 pr-3">{row.requesterName ?? "—"}</td>
                <td className="py-1.5 pr-3">{MONEY_STATE_LABEL[row.state]}</td>
                <td className="py-1.5 pr-3 text-right">{formatGbpMoney(row.clientCharge)}</td>
                <td className="py-1.5 pr-3 text-right">{formatGbpMoney(row.professionalPayout)}</td>
                <td className="py-1.5 text-right">{formatGbpMoney(row.platformFee)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#1e5a33] font-semibold">
              <td className="py-2 pr-3" colSpan={5}>
                Total
              </td>
              <td className="py-2 pr-3 text-right">{formatGbpMoney(totals.charged)}</td>
              <td className="py-2 pr-3 text-right">{formatGbpMoney(totals.payout)}</td>
              <td className="py-2 text-right">{formatGbpMoney(totals.fee)}</td>
            </tr>
          </tfoot>
        </table>
        {rows.length === 0 && (
          <p className="mt-4 text-sm text-[#4a4a4a]">No bookings match these filters.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[#1e5a33]">Monthly trend</h2>
        <table className="mt-3 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1e5a33] text-left">
              <th className="py-2 pr-3 font-semibold">Month</th>
              <th className="py-2 pr-3 font-semibold">Bookings</th>
              <th className="py-2 text-right font-semibold">Completed value</th>
            </tr>
          </thead>
          <tbody>
            {analytics.monthly.map((point) => (
              <tr key={point.month} className="border-b border-[#dbe7e0]">
                <td className="py-1.5 pr-3">{point.month}</td>
                <td className="py-1.5 pr-3">{point.bookings}</td>
                <td className="py-1.5 text-right">{formatGbpMoney(point.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-10 border-t border-[#dbe7e0] pt-4 text-xs text-[#7a8a81]">
        CareBridge Connect Ltd — figures are net of refunds. Platform fee is the client charge less
        the professional payout and any refund.
      </footer>
    </main>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dbe7e0] p-3">
      <p className="text-[11px] uppercase tracking-wide text-[#7a8a81]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#1e5a33]">{value}</p>
    </div>
  );
}
