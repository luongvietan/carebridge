"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptBooking, declineBooking } from "@/lib/bookings/actions";

type BookingRow = {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  location_address: string;
  professional_role_id: string;
  assigned_professional_id: string | null;
  total_payout: number | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

function BookingActions({
  bookingId,
  eligible,
  onDone,
}: {
  bookingId: string;
  eligible: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setBusy("accept");
    setError(null);
    const result = await acceptBooking(bookingId);
    setBusy(null);
    if ("error" in result) setError(result.error);
    else onDone();
  }

  async function handleDecline() {
    setBusy("decline");
    setError(null);
    const result = await declineBooking(bookingId);
    setBusy(null);
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      {!eligible && (
        <span className="text-xs text-[#684e1b]">Complete onboarding to accept bookings</span>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={!eligible || busy !== null}
          className="bg-[#198038] px-3 py-1.5 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
        >
          {busy === "accept" ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={busy !== null}
          className="border border-[#8c8c8c] px-3 py-1.5 text-sm hover:bg-[#f4f4f4] disabled:opacity-50"
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}

function BookingTable({ rows, showActions, eligible, onRefresh }: {
  rows: BookingRow[];
  showActions?: boolean;
  eligible?: boolean;
  onRefresh: () => void;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-[#525252]">None.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto border border-[#e0e0e0]">
      <table className="w-full text-sm">
        <thead className="border-b border-[#e0e0e0] bg-[#f4f4f4] text-left">
          <tr>
            <th className="p-3 font-medium">Start</th>
            <th className="p-3 font-medium">Location</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Payout</th>
            {showActions && <th className="p-3 font-medium" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e0e0e0]">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className="p-3">{formatDate(b.scheduled_start)}</td>
              <td className="p-3">{b.location_address}</td>
              <td className="p-3">
                <span className="bg-[#f4f4f4] px-2 py-0.5 text-xs text-[#525252]">
                  {b.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-3">{formatMoney(b.total_payout)}</td>
              {showActions && (
                <td className="p-3 text-right">
                  <BookingActions bookingId={b.id} eligible={!!eligible} onDone={onRefresh} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProfessionalBookings({
  open,
  mine,
  eligible,
}: {
  open: BookingRow[];
  mine: BookingRow[];
  eligible: boolean;
}) {
  const router = useRouter();
  const active = mine.filter((b) => !["completed", "cancelled", "no_show"].includes(b.status));
  const history = mine.filter((b) => ["completed", "cancelled", "no_show"].includes(b.status));

  return (
    <div>
      <section>
        <h2 className="text-xl font-light">Open bookings</h2>
        <BookingTable rows={open} showActions eligible={eligible} onRefresh={() => router.refresh()} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-light">My bookings</h2>
        <BookingTable rows={active} onRefresh={() => router.refresh()} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-light">History</h2>
        <BookingTable rows={history} onRefresh={() => router.refresh()} />
      </section>
    </div>
  );
}
