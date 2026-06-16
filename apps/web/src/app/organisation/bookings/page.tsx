import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { BookingCancelButton } from "@/components/booking-cancel-button";
import { PayNowButton } from "@/components/pay-now-button";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["open", "accepted", "assigned"]);
const PAYABLE = new Set(["accepted", "assigned"]);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export default async function OrganisationBookingsPage() {
  const supabase = await createClient();
  const admin = createServiceClient();

  const [{ data: bookings }, { data: roles }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, status, scheduled_start, scheduled_end, location_address, professional_role_id, total_client_charge",
      )
      .order("scheduled_start", { ascending: false }),
    supabase.from("professional_roles").select("id, name"),
  ]);

  const roleNames = new Map((roles ?? []).map((r) => [r.id, r.name]));

  // Load latest payment status per booking via service client (payments is admin-RLS).
  const bookingIds = (bookings ?? []).map((b) => b.id);
  const paymentStatusByBooking = new Map<string, string>();
  if (bookingIds.length > 0) {
    const { data: payments } = await admin
      .from("payments")
      .select("booking_id, status, created_at")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    // Pick the most recent payment per booking.
    const seen = new Set<string>();
    for (const p of payments ?? []) {
      if (!seen.has(p.booking_id)) {
        paymentStatusByBooking.set(p.booking_id, p.status);
        seen.add(p.booking_id);
      }
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold">Bookings</h1>
        </div>
        <Link
          href="/organisation/bookings/new"
          className="rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42]"
        >
          New booking
        </Link>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="mt-8 overflow-x-auto border border-[#dbe7e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7e0]">
              {bookings.map((b) => {
                const payStatus = paymentStatusByBooking.get(b.id) ?? null;
                const needsPay = PAYABLE.has(b.status) && payStatus !== "succeeded";
                return (
                  <tr key={b.id}>
                    <td className="p-3">{formatDate(b.scheduled_start)}</td>
                    <td className="p-3">{roleNames.get(b.professional_role_id) ?? b.professional_role_id}</td>
                    <td className="p-3">
                      <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3">{formatMoney(b.total_client_charge)}</td>
                    <td className="p-3">
                      {payStatus ? (
                        <span className="bg-[#f5f7f6] px-2 py-0.5 text-xs text-[#5b6a62]">
                          {payStatus.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-[#5b6a62]">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex flex-col items-end gap-1">
                        {needsPay && <PayNowButton bookingId={b.id} />}
                        {CANCELLABLE.has(b.status) && <BookingCancelButton bookingId={b.id} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-sm text-[#5b6a62]">No bookings yet.</p>
      )}
    </main>
  );
}
