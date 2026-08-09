import { DashboardGrid } from "@/components/dashboard-grid";
import { ForwardLink } from "@/components/forward-link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { loadBookingFinance } from "@/lib/finance/load-bookings";
import { MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";
import { formatGbpMoney } from "@/lib/format/money";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const finance = user
    ? await loadBookingFinance(createServiceClient(), {
        requesterUserId: user.id,
      })
    : null;

  const rows = finance?.rows ?? [];
  const active = rows.filter((r) => ACTIVE.has(r.status));
  const completed = rows.filter((r) => r.status === "completed");
  const spendToDate = completed.reduce((sum, r) => sum + r.clientCharge, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const spendThisMonth = completed
    .filter((r) => r.scheduledStart.slice(0, 7) === thisMonth)
    .reduce((sum, r) => sum + r.clientCharge, 0);
  const professionals = new Set(
    rows
      .map((r) => r.professionalName)
      .filter((name): name is string => Boolean(name)),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
      {user?.email && (
        <p className="mt-2 text-sm text-[#4a4a4a]">Signed in as {user.email}</p>
      )}

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Active bookings" value={String(active.length)} />
        <Tile label="Completed" value={String(completed.length)} />
        <Tile label="Spend this month" value={formatGbpMoney(spendThisMonth)} />
        <Tile label="Spend to date" value={formatGbpMoney(spendToDate)} />
      </section>

      {professionals.size > 0 && (
        <p className="mt-3 text-sm text-[#4a4a4a]">
          {professionals.size} professional{professionals.size === 1 ? "" : "s"}{" "}
          have worked for you: {[...professionals].join(", ")}.
        </p>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Payment history</h2>
          <ForwardLink
            href="/organisation/bookings"
            className="text-sm text-[#2e7d32] hover:underline"
          >
            All bookings
          </ForwardLink>
        </div>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-[#4a4a4a]">No bookings yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#4a4a4a]">
                <tr>
                  <th className="p-3 font-medium">Shift</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Professional</th>
                  <th className="p-3 font-medium">Charge</th>
                  <th className="p-3 font-medium">Payment</th>
                  <th className="p-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe7e0]">
                {rows.slice(0, 20).map((row) => (
                  <tr key={row.bookingId}>
                    <td className="p-3 whitespace-nowrap">
                      {formatLondon(row.scheduledStart)}
                    </td>
                    <td className="p-3">{row.roleName ?? "—"}</td>
                    <td className="p-3">{row.professionalName ?? "—"}</td>
                    <td className="p-3">{formatGbpMoney(row.clientCharge)}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#4a4a4a]">
                        {MONEY_STATE_LABEL[row.state]}
                      </span>
                    </td>
                    <td className="p-3">
                      <ForwardLink
                        href={`/organisation/bookings/${row.bookingId}/invoice`}
                        className="text-[#2e7d32] hover:underline"
                      >
                        View
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
              title: "Messages",
              description:
                "Message the CareBridge Connect team and read their replies.",
              cta: "Open messages",
            },
            {
              href: "/organisation/register",
              title: "Your profile",
              description:
                "Set up organisation details, contacts and billing information.",
              cta: "Manage profile",
            },
            {
              href: "/organisation/bookings",
              title: "Bookings",
              description:
                "Request staff cover and manage bookings across your sites.",
              cta: "View bookings",
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
