import { TableScroll } from "@/components/table-scroll";
import { AdminTableHeader } from "@/components/admin-table-header";
import { getPortalLocale, getPortalT } from "@/lib/i18n/portal-server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatMoney } from "@/lib/format/money";
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
  const [{ t }, locale, supabase] = await Promise.all([
    getPortalT().then((t) => ({ t })),
    getPortalLocale(),
    createClient(),
  ]);
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
  // Never summed across currencies: the total is in the currency of the latest payout.
  const currency = rows[0]?.currency ?? "GBP";
  const totalPaid = rows
    .filter((p) => p.status === "paid" && p.currency === currency)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("Earnings")}</h1>
      <p className="mt-2 text-sm text-ink">
        {t("Payouts recorded for your completed bookings. Amounts are net of any client refunds.")}
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4">
        <span className="text-sm text-ink">{t("Total paid to date")}</span>
        <p className="text-2xl font-bold text-heading">{formatMoney(totalPaid, currency)}</p>
      </div>

      <TableScroll className="mt-8 rounded-2xl border border-line shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
        <table className="w-full text-sm">
          <AdminTableHeader>
            <tr>
              <th className="p-3 font-medium">{t("Amount")}</th>
              <th className="p-3 font-medium">{t("Status")}</th>
              <th className="p-3 font-medium">{t("Method")}</th>
              <th className="p-3 font-medium">{t("Reference")}</th>
              <th className="p-3 font-medium">{t("Recorded")}</th>
              <th className="p-3 font-medium">{t("Paid")}</th>
            </tr>
          </AdminTableHeader>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-medium">{formatMoney(Number(p.amount), p.currency ?? "GBP")}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? "bg-surface text-ink"}`}
                  >
                    {t(p.status)}
                  </span>
                </td>
                <td className="p-3">{p.method ? t(p.method.replace(/_/g, " ")) : "—"}</td>
                <td className="p-3">{p.reference ?? "—"}</td>
                <td className="p-3 text-ink">{p.recorded_at ? formatLondon(p.recorded_at, locale) : "—"}</td>
                <td className="p-3 text-ink">{p.paid_at ? formatLondon(p.paid_at, locale) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-sm text-ink">
            {t("No payouts yet. Payouts appear here once an administrator records payment for a completed booking.")}
          </p>
        )}
      </TableScroll>
    </main>
  );
}
