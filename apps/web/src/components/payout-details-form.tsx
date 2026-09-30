"use client";
import { Tr } from "@/components/portal-locale";
import { useActionState, useState } from "react";
import { savePayoutDetails, type PayoutResult } from "@/lib/payouts/actions";

const field =
  "mt-1 w-full rounded-xl border border-[#dbe7e0] bg-white px-3 py-2 text-sm focus:border-[#2e7d32] focus:outline-none";

const COPY = {
  "en-GB": {
    saved: "Bank details saved — we store only the last 4 digits.",
    current: "Current account ending",
    uk: "UK bank account",
    iban: "IBAN (Portugal / SEPA)",
    accountName: "Account name",
    sortCode: "Sort code",
    accountNumber: "Account number",
    save: "Save bank details",
    saving: "Saving…",
  },
  "pt-PT": {
    saved: "Dados bancários guardados — guardamos apenas os últimos 4 dígitos.",
    current: "Conta atual terminada em",
    uk: "Conta bancária no Reino Unido",
    iban: "IBAN (Portugal / SEPA)",
    accountName: "Nome do titular da conta",
    sortCode: "Sort code",
    accountNumber: "Número de conta",
    save: "Guardar dados bancários",
    saving: "A guardar…",
  },
} as const;

export function PayoutDetailsForm({
  last4,
  defaultKind = "uk",
  locale = "en-GB",
}: {
  last4: string | null;
  defaultKind?: "uk" | "iban";
  locale?: "en-GB" | "pt-PT";
}) {
  const t = COPY[locale];
  const [kind, setKind] = useState<"uk" | "iban">(defaultKind);
  const [state, action, pending] = useActionState<PayoutResult, FormData>(
    async (_prev: PayoutResult, formData: FormData) => {
      const accountName = formData.get("accountName") as string;
      return kind === "iban"
        ? savePayoutDetails({ kind: "iban", accountName, iban: formData.get("iban") as string })
        : savePayoutDetails({
            kind: "uk",
            accountName,
            sortCode: formData.get("sortCode") as string,
            accountNumber: formData.get("accountNumber") as string,
          });
    },
    null as unknown as PayoutResult,
  );

  if (state && "ok" in state) {
    return <p className="mt-4 text-sm text-[#2e7d32]">{t.saved}</p>;
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      {last4 !== null && (
        <p className="text-sm text-[#4a4a4a]">
          {t.current} ••••{last4}
        </p>
      )}

      <div role="radiogroup" className="flex flex-wrap gap-4 text-sm">
        {(["uk", "iban"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
            />
            {k === "uk" ? t.uk : t.iban}
          </label>
        ))}
      </div>

      <label className="block text-sm font-medium" htmlFor="accountName">
        {t.accountName}
        <input id="accountName" name="accountName" required className={field} />
      </label>

      {kind === "uk" ? (
        <>
          <label className="block text-sm font-medium" htmlFor="sortCode">
            {t.sortCode}
            <input
              id="sortCode"
              name="sortCode"
              required
              inputMode="numeric"
              maxLength={8}
              placeholder="00-00-00"
              className={field}
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="accountNumber">
            {t.accountNumber}
            <input
              id="accountNumber"
              name="accountNumber"
              required
              inputMode="numeric"
              maxLength={8}
              placeholder="00000000"
              className={field}
            />
          </label>
        </>
      ) : (
        <label className="block text-sm font-medium" htmlFor="iban">
          IBAN
          <input
            id="iban"
            name="iban"
            required
            autoComplete="off"
            maxLength={42}
            placeholder="PT50 0000 0000 0000 0000 0000 0"
            className={field}
          />
        </label>
      )}

      {state && "error" in state && <p className="text-sm text-[#da1e28]"><Tr>{state.error}</Tr></p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}
