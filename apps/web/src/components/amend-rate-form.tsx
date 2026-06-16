"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { amendRateCard } from "@/lib/admin/rate-actions";
import type { PlatformFeeType } from "@/lib/admin/rates";
import { Select } from "@/components/ui/select";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#0c4a35] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

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

        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Platform fee type
          <Select
            aria-label="Platform fee type"
            value={platformFeeType}
            onValueChange={(v) => setPlatformFeeType(v as PlatformFeeType)}
            options={[
              { value: "derived", label: "Derived (charge − payout)" },
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed" },
            ]}
          />
        </div>

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
        className="rounded-full bg-[#0c6e4f] px-4 py-1.5 text-white hover:bg-[#0a5c42] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Amend rate card"}
      </button>
    </form>
  );
}
