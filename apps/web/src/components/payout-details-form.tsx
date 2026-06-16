"use client";
import { useActionState } from "react";
import { savePayoutDetails, type PayoutResult } from "@/lib/payouts/actions";

const field =
  "mt-1 w-full rounded-none border-b border-[#7a8a81] bg-[#f5f7f6] px-3 py-2 text-sm focus:border-[#198038] focus:outline-none";

export function PayoutDetailsForm({ last4 }: { last4: string | null }) {
  const [state, action, pending] = useActionState<PayoutResult, FormData>(
    async (_prev: PayoutResult, formData: FormData) => {
      return savePayoutDetails({
        accountName: formData.get("accountName") as string,
        sortCode: formData.get("sortCode") as string,
        accountNumber: formData.get("accountNumber") as string,
      });
    },
    null as unknown as PayoutResult,
  );

  if (state && "ok" in state) {
    return (
      <p className="mt-4 text-sm text-[#198038]">
        Bank details saved — we store only the last 4 digits.
      </p>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      {last4 !== null && (
        <p className="text-sm text-[#5b6a62]">
          Current account ending ••••{last4}
        </p>
      )}
      <label className="block text-sm font-medium" htmlFor="accountName">
        Account name
        <input
          id="accountName"
          name="accountName"
          required
          className={field}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="sortCode">
        Sort code
        <input
          id="sortCode"
          name="sortCode"
          required
          placeholder="00-00-00"
          className={field}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="accountNumber">
        Account number
        <input
          id="accountNumber"
          name="accountNumber"
          required
          placeholder="00000000"
          className={field}
        />
      </label>

      {state && "error" in state && (
        <p className="text-sm text-[#da1e28]">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save bank details"}
      </button>
    </form>
  );
}
