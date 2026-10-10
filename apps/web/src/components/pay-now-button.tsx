"use client";
import { useState } from "react";
import { usePortalLocale, usePortalT, Tr } from "@/components/portal-locale";
import { startCheckout } from "@/lib/payments/actions";

export function PayNowButton({ bookingId }: { bookingId: string }) {
  const t = usePortalT();
  const locale = usePortalLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setBusy(true);
    setError(null);
    try {
      const result = await startCheckout(bookingId);
      if ("error" in result) {
        setError(t(result.error));
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setError(locale === "pt-PT" ? "Não foi possível concluir a operação. Tente novamente." : "Could not complete the operation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {error && <span role="alert" className="text-xs text-danger"><Tr>{error}</Tr></span>}
      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        {busy ? t("Redirecting…") : t("Pay now")}
      </button>
    </span>
  );
}
