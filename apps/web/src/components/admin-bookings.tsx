"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignBooking, cancelBooking, completeBooking, markNoShow } from "@/lib/bookings/actions";
import { Select } from "@/components/ui/select";

import { formatGbpMoney } from "@/lib/format/money";

type AdminBooking = {
  id: string;
  status: string;
  booking_type: string;
  scheduled_start: string;
  professional_role_id: string;
  assigned_professional_id: string | null;
  professional_roles: { name: string } | null;
  total_client_charge: number | null;
};

type Professional = {
  id: string;
  full_name: string;
  professional_role_id: string | null;
  can_accept_bookings: boolean | null;
};

const TERMINAL = new Set(["completed", "cancelled", "no_show"]);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(amount: number | null) {
  return formatGbpMoney(amount);
}

function AssignControl({
  bookingId,
  roleId,
  professionals,
  onDone,
}: {
  bookingId: string;
  roleId: string;
  professionals: Professional[];
  onDone: () => void;
}) {
  const eligible = professionals.filter(
    (p) => p.professional_role_id === roleId && !!p.can_accept_bookings,
  );
  const [selected, setSelected] = useState(eligible[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const result = await assignBooking(bookingId, selected);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else onDone();
  }

  if (eligible.length === 0) {
    return <span className="text-xs text-[#5b6a62]">No eligible professionals</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <div className="flex items-center gap-2">
        <Select
          aria-label="Assign professional"
          className="w-48"
          value={selected}
          onValueChange={setSelected}
          options={eligible.map((p) => ({ value: p.id, label: p.full_name }))}
        />
        <button
          type="button"
          onClick={handleAssign}
          disabled={busy || !selected}
          className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
        >
          {busy ? "Assigning…" : "Assign"}
        </button>
      </div>
    </div>
  );
}

function CancelControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!window.confirm("Cancel this booking?")) return;
    setBusy(true);
    setError(null);
    const result = await cancelBooking(bookingId);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <button
        type="button"
        onClick={handleCancel}
        disabled={busy}
        className="rounded-full border border-[#da1e28] px-3 py-1.5 text-sm text-[#da1e28] hover:bg-[#fff1f1] disabled:opacity-50"
      >
        {busy ? "Cancelling…" : "Cancel"}
      </button>
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
        className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Mark completed"}
      </button>
    </div>
  );
}

function NoShowControl({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNoShow() {
    if (!window.confirm("Mark this booking as no-show?")) return;
    setBusy(true);
    setError(null);
    const result = await markNoShow(bookingId);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else onDone();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <button
        type="button"
        onClick={handleNoShow}
        disabled={busy}
        className="rounded-full border border-[#dbe7e0] px-4 py-1.5 text-sm font-medium text-[#1e5a33] transition hover:border-[#bcd8c7] hover:bg-[#f5f7f6] disabled:opacity-50"
      >
        {busy ? "Saving…" : "No-show"}
      </button>
    </div>
  );
}

export function AdminBookings({
  bookings,
  professionals,
}: {
  bookings: AdminBooking[];
  professionals: Professional[];
}) {
  const router = useRouter();

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-[#dbe7e0] shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[#dbe7e0] bg-[#f5f7f6] text-left text-[#5b6a62]">
          <tr>
            <th className="p-3 font-medium">Date</th>
            <th className="p-3 font-medium">Role</th>
            <th className="p-3 font-medium">Type</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Total</th>
            <th className="p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dbe7e0]">
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="p-3">{formatDate(b.scheduled_start)}</td>
              <td className="p-3">{b.professional_roles?.name ?? b.professional_role_id}</td>
              <td className="p-3">{b.booking_type.replace(/_/g, " ")}</td>
              <td className="p-3">
                <span className="rounded-full bg-[#f5f7f6] px-2.5 py-0.5 text-xs font-medium text-[#5b6a62]">
                  {b.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-3">{formatMoney(b.total_client_charge)}</td>
              <td className="p-3">
                <div className="flex flex-col items-end gap-2">
                  {b.status === "open" && (
                    <AssignControl
                      bookingId={b.id}
                      roleId={b.professional_role_id}
                      professionals={professionals}
                      onDone={() => router.refresh()}
                    />
                  )}
                  {!TERMINAL.has(b.status) && (
                    <>
                      <CompleteControl bookingId={b.id} onDone={() => router.refresh()} />
                      <NoShowControl bookingId={b.id} onDone={() => router.refresh()} />
                      <CancelControl bookingId={b.id} onDone={() => router.refresh()} />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <p className="p-6 text-sm text-[#5b6a62]">No bookings yet.</p>
      )}
    </div>
  );
}
