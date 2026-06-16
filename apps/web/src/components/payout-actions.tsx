"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPayout, markPayoutPaid } from "@/lib/payouts/actions";

export function RecordPayoutButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecord() {
    setBusy(true);
    setError(null);
    const result = await recordPayout(bookingId);
    setBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <button
        type="button"
        onClick={handleRecord}
        disabled={busy}
        className="bg-[#198038] px-3 py-1.5 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {busy ? "Recording…" : "Record payout"}
      </button>
    </span>
  );
}

export function MarkPayoutPaidForm({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Reference is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await markPayoutPaid(payoutId, method, reference.trim());
    setBusy(false);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-1">
      {error && <span className="text-xs text-[#da1e28]">{error}</span>}
      <div className="flex items-center gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="border-b border-[#7a8a81] bg-[#f5f7f6] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none"
        >
          <option value="bank_transfer">Bank transfer</option>
          <option value="bacs">BACS</option>
          <option value="faster_payments">Faster Payments</option>
          <option value="cheque">Cheque</option>
        </select>
        <input
          type="text"
          placeholder="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="border-b border-[#7a8a81] bg-transparent px-2 py-1 text-sm focus:border-[#198038] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-[#198038] px-3 py-1.5 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Mark paid"}
        </button>
      </div>
    </form>
  );
}
