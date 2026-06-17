"use client";
import { useState } from "react";
import { startCheckout } from "@/lib/payments/actions";

export function PayNowButton({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setBusy(true);
    setError(null);
    const result = await startCheckout(bookingId);
    if ("error" in result) {
      setError(result.error);
      setBusy(false);
    } else if (result.url) {
      window.location.href = result.url;
      // stay busy until navigation completes
    } else {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="rounded-full bg-[#2e7d32] px-3 py-1.5 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {busy ? "Redirecting…" : "Pay now"}
      </button>
    </span>
  );
}
