"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/bookings/actions";

export function BookingCancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!window.confirm("Cancel this booking?")) return;
    setBusy(true);
    setError(null);
    const result = await cancelBooking(bookingId);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <button
        type="button"
        onClick={handleCancel}
        disabled={busy}
        className="rounded-full border border-[#da1e28] px-3 py-1.5 text-sm text-[#da1e28] hover:bg-[#fff1f1] disabled:opacity-50"
      >
        {busy ? "Cancelling…" : "Cancel"}
      </button>
    </span>
  );
}
