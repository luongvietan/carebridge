import { getPortalLocale, getPortalT } from "@/lib/i18n/portal-server";
import { DashboardGrid } from "@/components/dashboard-grid";
import { ForwardLink } from "@/components/forward-link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { loadBookingFinance } from "@/lib/finance/load-bookings";
import { MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";
import { formatMoney } from "@/lib/format/money";
import { formatLondon } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

const ACTIVE = new Set(["open", "accepted", "assigned", "in_progress"]);

/**
 * The organisation's own overview (client request, 7 Aug): what is booked, what
 * it has cost, who has worked for them and what has been paid.
 *
 * The figures come from the same loader the admin finance screen uses, filtered
 * to this organisation's own bookings, so an organisation and CareBridge Connect
 * are always looking at the same numbers.
 */
export default async function OrganisationHome() {
  const t = await getPortalT();
  const locale = await getPortalLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const finance = user
    ? await loadBookingFinance(createServiceClient(), {
        requesterUserId: user.id,
      })
    : null;

  const allRows = finance?.rows ?? [];
  // Totals are never summed across currencies: the figures are in the currency of
  // the most recent booking, and a booking in another currency is left out of them.
  const currency = allRows[0]?.currency ?? "GBP";
  const rows = allRows;
  const active = rows.filter((r) => ACTIVE.has(r.status));
  const completed = rows.filter((r) => r.status === "completed");
  const completedInCurrency = completed.filter((r) => r.currency === currency);
  const spendToDate = completedInCurrency.reduce((sum, r) => sum + r.clientCharge, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const spendThisMonth = completedInCurrency
    .filter((r) => r.scheduledStart.slice(0, 7) === thisMonth)
    .reduce((sum, r) => sum + r.clientCharge, 0);
  const professionals = new Set(
    rows
      .map((r) => r.professionalName)
      .filter((name): name is string => Boolean(name)),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{t("Dashboard")}</h1>
      {user?.email && (
        <p className="mt-2 text-sm text-[#4a4a4a]">{t("Signed in as")}{" "}{user.email}</p>
      )}

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label={t("Active bookings")} value={String(active.length)} />
        <Tile label={t("Completed")} value={String(completed.length)} />
        <Tile label={t("Spend this month")} value={formatMoney(spendThisMonth, currency)} />
        <Tile label={t("Spend to date")} value={formatMoney(spendToDate, currency)} />
      </section>

      {professionals.size > 0 && (
        <p className="mt-3 text-sm text-[#4a4a4a]">
          {professionals.size === 1
            ? t("1 professional has worked for you:")
            : t("{n} professionals have worked for you:", { n: professionals.size })}{" "}
          {[...professionals].join(", ")}.
        </p>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("Payment history")}</h2>
          <ForwardLink
            href="/organisation/bookings"
            className="text-sm text-[#2e7d32] hover:underline"
          >
            {t("All bookings")}
          </ForwardLink>
        </div>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-[#4a4a4a]">{t("No bookings yet.")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
                <tr>
                  <th className="p-3 font-medium">{t("Shift")}</th>
                  <th className="p-3 font-medium">{t("Role")}</th>
                  <th className="p-3 font-medium">{t("Professional")}</th>
                  <th className="p-3 font-medium">{t("Charge")}</th>
                  <th className="p-3 font-medium">{t("Payment")}</th>
                  <th className="p-3 font-medium">{t("Invoice")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {rows.slice(0, 20).map((row) => (
                  <tr key={row.bookingId}>
                    <td className="p-3 whitespace-nowrap">
                      {formatLondon(row.scheduledStart, locale)}
                    </td>
                    <td className="p-3">{row.roleName ?? "—"}</td>
                    <td className="p-3">{row.professionalName ?? "—"}</td>
                    <td className="p-3">{formatMoney(row.clientCharge, row.currency)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                        {t(MONEY_STATE_LABEL[row.state])}
                      </span>
                    </td>
                    <td className="p-3">
                      <ForwardLink
                        href={`/organisation/bookings/${row.bookingId}/invoice`}
                        className="text-[#2e7d32] hover:underline"
                      >
                        {t("View")}
                      </ForwardLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-10">
        <DashboardGrid
          cards={[
            {
              href: "/organisation/messages",
              title: t("Messages"),
              description: t(
                "Message the CareBridge Connect team and read their replies.",
              ),
              cta: t("Open messages"),
            },
            {
              href: "/organisation/register",
              title: t("Your profile"),
              description: t(
                "Set up organisation details, contacts and billing information.",
              ),
              cta: t("Manage profile"),
            },
            {
              href: "/organisation/bookings",
              title: t("Bookings"),
              description: t(
                "Request staff cover and manage bookings across your sites.",
              ),
              cta: t("View bookings"),
            },
          ]}
        />
      </div>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe7e0] bg-white p-4">
      <p className="text-2xl font-bold text-[#1e5a33]">{value}</p>
      <p className="mt-1 text-sm text-[#4a4a4a]">{label}</p>
    </div>
  );
}
