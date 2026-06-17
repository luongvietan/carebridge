"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptBooking, declineBooking, completeBooking } from "@/lib/bookings/actions";

import { formatGbpMoney } from "@/lib/format/money";

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
  return formatGbpMoney(amount);
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
          className="rounded-full bg-[#0c6e4f] px-3 py-1.5 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
        >
          {busy === "accept" ? "Accepting…" : "Accept"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={busy !== null}
          className="rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm font-medium text-[#0c4a35] transition hover:border-[#bcd8c7] hover:bg-[#f5f7f6] disabled:opacity-50"
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}

function CompleteControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    if (!window.confirm("Mark this booking as completed?")) return;
    setBusy(true);
    setError(null);
    const result = await completeBooking(bookingId);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <button
        type="button"
        onClick={handleComplete}
        disabled={busy}
        className="rounded-full bg-[#0c6e4f] px-3 py-1.5 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Mark completed"}
      </button>
    </div>
  );
}

function BookingTable({ rows, showActions, showComplete, eligible, onRefresh }: {
  rows: BookingRow[];
  showActions?: boolean;
  showComplete?: boolean;
  eligible?: boolean;
  onRefresh: () => void;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-[#5b6a62]">None.</p>;
  }

  const hasActionsCol = showActions || showComplete;

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
          <tr>
            <th className="p-3 font-medium">Start</th>
            <th className="p-3 font-medium">Location</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Payout</th>
            {hasActionsCol && (
              <th scope="col" className="p-3 font-medium"><span className="sr-only">Actions</span></th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dbe7e0]">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className="p-3">{formatDate(b.scheduled_start)}</td>
              <td className="p-3">{b.location_address}</td>
              <td className="p-3">
                <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#5b6a62]">
                  {b.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-3">{formatMoney(b.total_payout)}</td>
              {hasActionsCol && (
                <td className="p-3 text-right">
                  {showActions && (
                    <BookingActions bookingId={b.id} eligible={!!eligible} onDone={onRefresh} />
                  )}
                  {showComplete && (
                    <CompleteControl bookingId={b.id} onDone={onRefresh} />
                  )}
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
        <h2 className="text-xl font-bold">Open bookings</h2>
        <BookingTable rows={open} showActions eligible={eligible} onRefresh={() => router.refresh()} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">My bookings</h2>
        <BookingTable rows={active} showComplete onRefresh={() => router.refresh()} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">History</h2>
        <BookingTable rows={history} onRefresh={() => router.refresh()} />
      </section>
    </div>
  );
}
