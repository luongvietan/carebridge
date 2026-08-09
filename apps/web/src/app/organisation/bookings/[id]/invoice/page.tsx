import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatGbpMoney } from "@/lib/format/money";
import { formatLondon } from "@/lib/format/datetime";
import { moneyState, MONEY_STATE_LABEL } from "@/lib/finance/booking-finance";

export const dynamic = "force-dynamic";

/**
 * A printable invoice for one booking (client request, 7 Aug — organisations
 * should reach their invoices from one place).
 *
 * The booking is read through the caller's own session first, so RLS decides
 * whether it belongs to them; only then are the payment details fetched with the
 * service role. Passing the id alone must never be enough to read somebody
 * else's invoice.
 */
export default async function OrganisationInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_start, scheduled_end, duration_hours, location_address, total_client_charge, total_payout, requester_user_id, professional_roles(name), professionals(full_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.requester_user_id !== user.id) notFound();

  const admin = createServiceClient();
  const [{ data: organisation }, { data: payment }, { data: timesheet }] = await Promise.all([
    admin
      .from("organisations")
      .select("organisation_name, address_line1, city, postcode, billing_email")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("payments")
      .select("status, amount, refunded_amount, refunded_at, paid_at")
      .eq("booking_id", id)
      .maybeSingle(),
    admin
      .from("timesheets")
      .select("worked_hours, status, confirmed_at")
      .eq("booking_id", id)
      .maybeSingle(),
  ]);

  const state = moneyState({
    bookingId: id,
    totalClientCharge: booking.total_client_charge,
    totalPayout: booking.total_payout,
    bookingStatus: booking.status,
    payment: payment
      ? {
          status: payment.status,
          amount: payment.amount,
          refundedAmount: payment.refunded_amount,
          refundedAt: payment.refunded_at,
        }
      : null,
  });

  const hours = Number(timesheet?.worked_hours ?? booking.duration_hours ?? 0);
  const charge = Number(booking.total_client_charge ?? 0);
  const rate = hours > 0 ? charge / hours : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden">
        <BackLink href="/organisation">Back to dashboard</BackLink>
      </div>

      <header className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e5a33]">Invoice</h1>
          <p className="mt-1 text-sm text-[#4a4a4a]">
            Booking {booking.id.slice(0, 8).toUpperCase()} · issued{" "}
            {formatLondon(new Date().toISOString())}
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton
            label="Save as PDF"
            className="rounded-full bg-[#2e7d32] px-4 py-2 text-sm text-white hover:bg-[#246627]"
          />
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7a8a81]">From</p>
          <p className="mt-1 font-semibold text-[#1e5a33]">CareBridge Connect Ltd</p>
          <p className="text-sm text-[#4a4a4a]">Manchester, United Kingdom</p>
          <p className="text-sm text-[#4a4a4a]">info@carebridgeconnect.co.uk</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#7a8a81]">To</p>
          <p className="mt-1 font-semibold text-[#1e5a33]">
            {organisation?.organisation_name ?? "Organisation"}
          </p>
          {organisation?.address_line1 && (
            <p className="text-sm text-[#4a4a4a]">
              {organisation.address_line1}, {organisation.city} {organisation.postcode}
            </p>
          )}
          {organisation?.billing_email && (
            <p className="text-sm text-[#4a4a4a]">{organisation.billing_email}</p>
          )}
        </div>
      </section>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#1e5a33] text-left">
            <th className="py-2 pr-3 font-semibold">Description</th>
            <th className="py-2 pr-3 text-right font-semibold">Hours</th>
            <th className="py-2 pr-3 text-right font-semibold">Rate</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#dbe7e0]">
            <td className="py-3 pr-3">
              {(booking.professional_roles as { name: string } | null)?.name ?? "Care booking"}
              <span className="block text-xs text-[#7a8a81]">
                {formatLondon(booking.scheduled_start)} to {formatLondon(booking.scheduled_end)} ·{" "}
                {booking.location_address}
              </span>
              {(booking.professionals as { full_name: string } | null)?.full_name && (
                <span className="block text-xs text-[#7a8a81]">
                  Worked by {(booking.professionals as { full_name: string }).full_name}
                </span>
              )}
              {timesheet?.status === "confirmed" && (
                <span className="block text-xs text-[#0e6027]">
                  Hours confirmed{timesheet.confirmed_at ? ` on ${timesheet.confirmed_at.slice(0, 10)}` : ""}
                </span>
              )}
            </td>
            <td className="py-3 pr-3 text-right">{hours}</td>
            <td className="py-3 pr-3 text-right">{formatGbpMoney(rate)}</td>
            <td className="py-3 text-right">{formatGbpMoney(charge)}</td>
          </tr>
        </tbody>
        <tfoot>
          {Number(payment?.refunded_amount ?? 0) > 0 && (
            <tr>
              <td className="py-2 pr-3 text-right" colSpan={3}>
                Refunded
              </td>
              <td className="py-2 text-right">
                −{formatGbpMoney(Number(payment?.refunded_amount ?? 0))}
              </td>
            </tr>
          )}
          <tr className="border-t-2 border-[#1e5a33] text-base font-bold">
            <td className="py-3 pr-3 text-right" colSpan={3}>
              Total
            </td>
            <td className="py-3 text-right">
              {formatGbpMoney(charge - Number(payment?.refunded_amount ?? 0))}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-6 text-sm text-[#4a4a4a]">
        Payment status: <span className="font-semibold">{MONEY_STATE_LABEL[state]}</span>
        {payment?.paid_at && ` · paid ${formatLondon(payment.paid_at)}`}
      </p>

      <footer className="mt-10 border-t border-[#dbe7e0] pt-4 text-xs text-[#7a8a81]">
        CareBridge Connect Ltd — a marketplace connecting families and organisations with verified
        healthcare and childcare professionals. This invoice covers the booking shown above.
      </footer>
    </main>
  );
}
