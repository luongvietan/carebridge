"use client";
import { usePortalT } from "@/components/portal-locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPayout, markPayoutPaid } from "@/lib/payouts/actions";
import { useConfirmDialog } from "@/components/ui/app-dialog";
import { Select } from "@/components/ui/select";

export function RecordPayoutButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const t = usePortalT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleRecord() {
    setBusy(true);
    setError(null);
    setSaved(false);
    let result: Awaited<ReturnType<typeof recordPayout>>;
    try { result = await recordPayout(bookingId); } catch { setError(t("Could not complete the operation. Please try again.")); return; } finally { setBusy(false); }
    if ("error" in result) setError(t(result.error));
    else { setSaved(true); router.refresh(); }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {saved && <span role="status" className="text-xs text-[#0e6027]">{t("Payout saved.")}</span>}
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
      <button
        type="button"
        onClick={handleRecord}
        disabled={busy}
        className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        {busy ? t("Recording…") : t("Record payout")}
      </button>
    </span>
  );
}

export function MarkPayoutPaidForm({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const t = usePortalT();
  const { confirm, dialog } = useConfirmDialog();
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      setError(t("Reference is required."));
      return;
    }
    if (!(await confirm(t("Mark this payout as paid using reference {reference}? Only confirm after the payment has been completed.", { reference: reference.trim() }), { confirmLabel: t("Confirm payment") }))) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    let result: Awaited<ReturnType<typeof markPayoutPaid>>;
    try { result = await markPayoutPaid(payoutId, method, reference.trim()); } catch { setError(t("Could not complete the operation. Please try again.")); return; } finally { setBusy(false); }
    if ("error" in result) setError(t(result.error));
    else { setSaved(true); router.refresh(); }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={busy} className="flex flex-col items-end gap-1">
      {dialog}
      {saved && <span role="status" className="text-xs text-[#0e6027]">{t("Payout saved.")}</span>}
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          aria-label={t("Payout method")}
          className="w-44"
          value={method}
          onValueChange={setMethod}
          options={[
            { value: "bank_transfer", label: t("Bank transfer") },
            { value: "bacs", label: t("BACS") },
            { value: "faster_payments", label: t("Faster Payments") },
            { value: "sepa_transfer", label: t("SEPA transfer") },
            { value: "cheque", label: t("Cheque") },
          ]}
        />
        <input
          type="text"
          placeholder={t("Reference")}
          aria-label={t("Payout reference")}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="rounded-lg border border-line bg-white px-2 py-1 text-sm focus:border-brand-strong focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
        >
          {busy ? t("Saving…") : t("Mark paid")}
        </button>
      </div>
    </form>
  );
}
