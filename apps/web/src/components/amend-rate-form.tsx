"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { amendRateCard } from "@/lib/admin/rate-actions";
import { type PlatformFeeType, SUPPORTED_CURRENCIES, resolveRateAmendment } from "@/lib/admin/rates";
import { Select } from "@/components/ui/select";
import { formatRate } from "@/lib/format/money";

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
  const showPayoutInput = state.platformFeeType === "derived";

  // Live preview of the payout the platform fee will produce (percentage/fixed).
  const preview =
    showFeeValue && state.clientChargeRate !== "" && state.platformFeeValue !== ""
      ? resolveRateAmendment({
          clientChargeRate: Number(state.clientChargeRate),
          platformFeeType: state.platformFeeType,
          platformFeeValue: Number(state.platformFeeValue),
          currency: state.currency,
        })
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "pending" });

    const result = await amendRateCard(roleId, {
      clientChargeRate: Number(state.clientChargeRate),
      professionalPayoutRate: showPayoutInput ? Number(state.professionalPayoutRate) : null,
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
      <p className="text-[#4a4a4a]">
        Amend rates for <span className="font-medium text-[#14301e]">{roleName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[#4a4a4a]">
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

        {showPayoutInput && (
          <label className="flex flex-col gap-1 text-[#4a4a4a]">
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
        )}

        <div className="flex flex-col gap-1 text-[#4a4a4a]">
          Platform fee type
          <Select
            aria-label="Platform fee type"
            value={state.platformFeeType}
            onValueChange={(v) => dispatch({ type: "set", field: "platformFeeType", value: v as PlatformFeeType })}
            options={[
              { value: "derived", label: "Derived (enter payout directly)" },
              { value: "percentage", label: "Percentage of charge" },
              { value: "fixed", label: "Fixed (£/hr)" },
            ]}
          />
        </div>

        {showFeeValue && (
          <label className="flex flex-col gap-1 text-[#4a4a4a]">
            {state.platformFeeType === "percentage" ? "Platform fee (%)" : "Platform fee (£/hr)"}
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

        <div className="flex flex-col gap-1 text-[#4a4a4a]">
          Currency
          <Select
            aria-label="Currency"
            value={state.currency}
            onValueChange={(v) => dispatch({ type: "set", field: "currency", value: v })}
            options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {preview &&
        (preview.ok ? (
          <p className="text-sm text-[#4a4a4a]">
            Professional payout will be{" "}
            <span className="font-semibold text-[#14301e]">
              {formatRate(preview.rate.professionalPayoutRate, state.currency)}/hr
            </span>{" "}
            — the platform keeps{" "}
            {formatRate(
              Number(state.clientChargeRate) - preview.rate.professionalPayoutRate,
              state.currency,
            )}
            /hr.
          </p>
        ) : (
          <p className="text-sm text-[#da1e28]">{preview.error}</p>
        ))}

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
