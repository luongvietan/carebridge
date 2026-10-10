import { getPortalT } from "@/lib/i18n/portal-server";
import { Tr } from "@/components/portal-locale";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PrintButton } from "@/components/print-button";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatAmountsByCurrency, formatMoney } from "@/lib/format/money";
import { londonDateRangeToUtc, formatLondon } from "@/lib/format/datetime";
import { loadBookingFinance } from "@/lib/finance/load-bookings";
import { MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";

export const dynamic = "force-dynamic";

/**
 * One amount per currency present — "£1,234 · €456" — never a cross-currency
 * sum. With a single currency it reads exactly as before.
 */
function totalsAsAmounts(
  totalsByCurrency: Record<string, { charged: number; payout: number; fee: number; refunded: number }>,
  pick: (group: { charged: number; payout: number; fee: number; refunded: number }) => number,
): Record<string, number> {
  return Object.fromEntries(Object.entries(totalsByCurrency).map(([currency, group]) => [currency, pick(group)]));
}

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
  const t = await getPortalT();

  if (!(await requireAdmin())) redirect("/login");
  const { from, to, bookingStatus, professionalId, requesterUserId } = await searchParams;
  const admin = createServiceClient();
  const { gte, lt } = londonDateRangeToUtc(from, to);

  const { rows, analytics, totalsByCurrency } = await loadBookingFinance(admin, {
    gte,
    lt,
    bookingStatus,
    professionalId,
    requesterUserId,
  });

  const period =
    from || to ? `${from ?? "the beginning"} to ${to ?? "today"}` : "all bookings to date";

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <BackLink href="/admin/finance"><Tr>{"Back to finance"}</Tr></BackLink>
      </div>

      <header className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink"><Tr>{"CareBridge Connect — finance report"}</Tr></h1>
          <p suppressHydrationWarning className="mt-1 text-sm text-ink">
            {period}<Tr>{"· generated"}</Tr>{formatLondon(new Date().toISOString())}
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton
            label={t("Save as PDF")}
            className="rounded-full bg-brand-strong px-4 py-2 text-sm text-white hover:bg-brand-strong-hover"
          />
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label={t("Bookings")} value={String(rows.length)} />
        <Figure label={t("Client charges")} value={formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.charged))} />
        <Figure
          label={t("Professional payouts")}
          value={formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.payout))}
        />
        <Figure label={t("Platform fees")} value={formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.fee))} />
        <Figure label={t("Refunded")} value={formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.refunded))} />
        <Figure label={t("Completion rate")} value={`${analytics.completionRate}%`} />
        <Figure label={t("Cancellation rate")} value={`${analytics.cancellationRate}%`} />
        <Figure
          label={t("Average booking")}
          value={
            formatAmountsByCurrency(analytics.averageBookingValueByCurrency)
          }
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-brand-ink"><Tr>{"Bookings"}</Tr></h2>
        <table className="mt-3 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-brand-ink text-left">
              <th className="py-2 pr-3 font-semibold"><Tr>{"Shift"}</Tr></th>
              <th className="py-2 pr-3 font-semibold"><Tr>{"Role"}</Tr></th>
              <th className="py-2 pr-3 font-semibold"><Tr>{"Professional"}</Tr></th>
              <th className="py-2 pr-3 font-semibold"><Tr>{"Client"}</Tr></th>
              <th className="py-2 pr-3 font-semibold"><Tr>{"Status"}</Tr></th>
              <th className="py-2 pr-3 text-right font-semibold"><Tr>{"Charge"}</Tr></th>
              <th className="py-2 pr-3 text-right font-semibold"><Tr>{"Payout"}</Tr></th>
              <th className="py-2 text-right font-semibold"><Tr>{"Fee"}</Tr></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bookingId} className="border-b border-line">
                <td className="py-1.5 pr-3 whitespace-nowrap">{formatLondon(row.scheduledStart)}</td>
                <td className="py-1.5 pr-3">{row.roleName ?? "—"}</td>
                <td className="py-1.5 pr-3">{row.professionalName ?? "—"}</td>
                <td className="py-1.5 pr-3">{row.requesterName ?? "—"}</td>
                <td className="py-1.5 pr-3">{MONEY_STATE_LABEL[row.state]}</td>
                <td className="py-1.5 pr-3 text-right">{formatMoney(row.clientCharge, row.currency)}</td>
                <td className="py-1.5 pr-3 text-right">
                  {formatMoney(row.professionalPayout, row.currency)}
                </td>
                <td className="py-1.5 text-right">{formatMoney(row.platformFee, row.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brand-ink font-semibold">
              <td className="py-2 pr-3" colSpan={5}><Tr>{"Total"}</Tr></td>
              <td className="py-2 pr-3 text-right">
                {formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.charged))}
              </td>
              <td className="py-2 pr-3 text-right">
                {formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.payout))}
              </td>
              <td className="py-2 text-right">
                {formatAmountsByCurrency(totalsAsAmounts(totalsByCurrency, (t) => t.fee))}
              </td>
            </tr>
          </tfoot>
        </table>
        {rows.length === 0 && (
          <p className="mt-4 text-sm text-ink"><Tr>{"No bookings match these filters."}</Tr></p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-brand-ink"><Tr>{"Monthly trend"}</Tr></h2>
        <table className="mt-3 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-brand-ink text-left">
              <th className="py-2 pr-3 font-semibold"><Tr>{"Month"}</Tr></th>
              <th className="py-2 pr-3 font-semibold"><Tr>{"Bookings"}</Tr></th>
              <th className="py-2 text-right font-semibold"><Tr>{"Completed value"}</Tr></th>
            </tr>
          </thead>
          <tbody>
            {analytics.monthly.map((point) => (
              <tr key={point.month} className="border-b border-line">
                <td className="py-1.5 pr-3">{point.month}</td>
                <td className="py-1.5 pr-3">{point.bookings}</td>
                <td className="py-1.5 text-right">
                  {formatAmountsByCurrency(point.revenueByCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-10 border-t border-line pt-4 text-xs text-muted"><Tr>{"CareBridge Connect Ltd — figures are net of refunds. Platform fee is the client charge less the professional payout and any refund."}</Tr></footer>
    </main>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-brand-ink">{value}</p>
    </div>
  );
}
