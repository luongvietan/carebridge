"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPayout, markPayoutPaid } from "@/lib/payouts/actions";
import { Select } from "@/components/ui/select";

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
        className="rounded-full bg-[#0c6e4f] px-3 py-1.5 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
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
        <Select
          aria-label="Payout method"
          className="w-44"
          value={method}
          onValueChange={setMethod}
          options={[
            { value: "bank_transfer", label: "Bank transfer" },
            { value: "bacs", label: "BACS" },
            { value: "faster_payments", label: "Faster Payments" },
            { value: "cheque", label: "Cheque" },
          ]}
        />
        <input
          type="text"
          placeholder="Reference"
          aria-label="Payout reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="rounded-lg border border-[#dbe7e0] bg-white px-2 py-1 text-sm focus:border-[#198038] focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#0c6e4f] px-3 py-1.5 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Mark paid"}
        </button>
      </div>
    </form>
  );
}
