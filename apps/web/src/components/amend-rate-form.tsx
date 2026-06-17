"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { amendRateCard } from "@/lib/admin/rate-actions";
import { type PlatformFeeType, SUPPORTED_CURRENCIES } from "@/lib/admin/rates";
import { Select } from "@/components/ui/select";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#dbe7e0] bg-white px-3.5 py-2.5 text-sm text-[#1e5a33] placeholder:text-[#9aa8a0] focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/15";

type Props = {
  roleId: string;
  roleName: string;
};

type State = {
  clientChargeRate: string;
  professionalPayoutRate: string;
  platformFeeType: PlatformFeeType;
  platformFeeValue: string;
  currency: string;
  error: string | null;
  pending: boolean;
};

type Action =
  | { type: "set"; field: keyof Omit<State, "error" | "pending">; value: string | PlatformFeeType }
  | { type: "pending" }
  | { type: "error"; error: string }
  | { type: "reset" };

const initialState: State = {
  clientChargeRate: "",
  professionalPayoutRate: "",
  platformFeeType: "derived",
  platformFeeValue: "",
  currency: "GBP",
  error: null,
  pending: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "pending":
      return { ...state, pending: true, error: null };
    case "error":
      return { ...state, pending: false, error: action.error };
    case "reset":
      return { ...initialState };
    default:
      return state;
  }
}

export function AmendRateForm({ roleId, roleName }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  const showFeeValue = state.platformFeeType !== "derived";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "pending" });

    const result = await amendRateCard(roleId, {
      clientChargeRate: Number(state.clientChargeRate),
      professionalPayoutRate: Number(state.professionalPayoutRate),
      platformFeeType: state.platformFeeType,
      platformFeeValue: showFeeValue ? Number(state.platformFeeValue) : null,
      currency: state.currency,
    });

    if ("error" in result) {
      dispatch({ type: "error", error: result.error });
      return;
    }

    dispatch({ type: "reset" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <p className="text-[#5b6a62]">
        Amend rates for <span className="font-medium text-[#14301e]">{roleName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[#5b6a62]">
          Client charge rate (£/hr)
          <input
            type="number"
            step="0.01"
            min="0"
            value={state.clientChargeRate}
            onChange={(e) => dispatch({ type: "set", field: "clientChargeRate", value: e.target.value })}
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
            value={state.professionalPayoutRate}
            onChange={(e) => dispatch({ type: "set", field: "professionalPayoutRate", value: e.target.value })}
            className={INPUT_CLASS}
            required
          />
        </label>

        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Platform fee type
          <Select
            aria-label="Platform fee type"
            value={state.platformFeeType}
            onValueChange={(v) => dispatch({ type: "set", field: "platformFeeType", value: v as PlatformFeeType })}
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
              value={state.platformFeeValue}
              onChange={(e) => dispatch({ type: "set", field: "platformFeeValue", value: e.target.value })}
              className={INPUT_CLASS}
              required
            />
          </label>
        )}

        <div className="flex flex-col gap-1 text-[#5b6a62]">
          Currency
          <Select
            aria-label="Currency"
            value={state.currency}
            onValueChange={(v) => dispatch({ type: "set", field: "currency", value: v })}
            options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-[#da1e28]">{state.error}</p>}

      <button
        type="submit"
        disabled={state.pending}
        className="rounded-full bg-[#2e7d32] px-4 py-1.5 text-white hover:bg-[#246627] disabled:opacity-50"
      >
        {state.pending ? "Saving…" : "Amend rate card"}
      </button>
    </form>
  );
}
