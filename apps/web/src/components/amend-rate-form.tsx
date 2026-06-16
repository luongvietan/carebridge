"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { amendRateCard } from "@/lib/admin/rate-actions";
import type { PlatformFeeType } from "@/lib/admin/rates";

const INPUT_CLASS =
  "border-b border-[#7a8a81] bg-[#f5f7f6] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none w-full";
const SELECT_CLASS =
  "border-b border-[#7a8a81] bg-[#f5f7f6] px-2 py-1 text-sm focus:border-[#198038] focus:outline-none w-full";

type Props = {
  roleId: string;
  roleName: string;
};

export function AmendRateForm({ roleId, roleName }: Props) {
  const router = useRouter();

  const [clientChargeRate, setClientChargeRate] = useState("");
  const [professionalPayoutRate, setProfessionalPayoutRate] = useState("");
  const [platformFeeType, setPlatformFeeType] = useState<PlatformFeeType>("derived");
  const [platformFeeValue, setPlatformFeeValue] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const showFeeValue = platformFeeType !== "derived";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await amendRateCard(roleId, {
      clientChargeRate: Number(clientChargeRate),
      professionalPayoutRate: Number(professionalPayoutRate),
      platformFeeType,
      platformFeeValue: showFeeValue ? Number(platformFeeValue) : null,
      currency,
    });

    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setClientChargeRate("");
    setProfessionalPayoutRate("");
    setPlatformFeeType("derived");
    setPlatformFeeValue("");
    setCurrency("GBP");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <p className="text-[#5b6a62]">
        Amend rates for <span className="font-medium text-[#0f261c]">{roleName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Client charge rate (£/hr)
          <input
            type="number"
            step="0.01"
            min="0"
            value={clientChargeRate}
            onChange={(e) => setClientChargeRate(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Professional payout rate (£/hr)
          <input
            type="number"
            step="0.01"
            min="0"
            value={professionalPayoutRate}
            onChange={(e) => setProfessionalPayoutRate(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Platform fee type
          <select
            value={platformFeeType}
            onChange={(e) => setPlatformFeeType(e.target.value as PlatformFeeType)}
            className={SELECT_CLASS}
          >
            <option value="derived">Derived (charge − payout)</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>

        {showFeeValue && (
          <label className="flex flex-col gap-1 text-[#5b6a62]">
            Platform fee value
            <input
              type="number"
              step="0.01"
              min="0"
              value={platformFeeValue}
              onChange={(e) => setPlatformFeeValue(e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Currency
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className={INPUT_CLASS}
            maxLength={3}
            required
          />
        </label>
      </div>

      {error && <p className="text-sm text-[#da1e28]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-[#198038] px-4 py-1.5 text-white hover:bg-[#0e6027] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Amend rate card"}
      </button>
    </form>
  );
}
