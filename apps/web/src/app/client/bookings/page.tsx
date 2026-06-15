import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookingCancelButton } from "@/components/booking-cancel-button";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["open", "accepted", "assigned"]);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export default async function ClientBookingsPage() {
  const supabase = await createClient();
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-[#525252] uppercase">Client</p>
          <h1 className="mt-1 text-3xl font-light">Bookings</h1>
        </div>
        <Link
          href="/client/bookings/new"
          className="bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027]"
        >
          New booking
        </Link>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="mt-8 overflow-x-auto border border-[#e0e0e0]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="p-3">{formatDate(b.scheduled_start)}</td>
                  <td className="p-3">{roleNames.get(b.professional_role_id) ?? b.professional_role_id}</td>
                  <td className="p-3">
                    <span className="bg-[#f4f4f4] px-2 py-0.5 text-xs text-[#525252]">
                      {b.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3">{formatMoney(b.total_client_charge)}</td>
                  <td className="p-3 text-right">
                    {CANCELLABLE.has(b.status) && <BookingCancelButton bookingId={b.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-sm text-[#525252]">No bookings yet.</p>
      )}
    </main>
  );
}
