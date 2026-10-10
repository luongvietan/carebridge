"use client";

import { RequiredMark } from "@/components/required-mark";
import { Tr, usePortalT } from "@/components/portal-locale";
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { amendRateCard } from "@/lib/admin/rate-actions";
import { type PlatformFeeType, SUPPORTED_CURRENCIES, resolveRateAmendment } from "@/lib/admin/rates";
import { Select } from "@/components/ui/select";
import { currencySymbol, formatRate } from "@/lib/format/money";

const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-muted focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-strong/15";

type Props = {
  roleId: string;
  roleName: string;
  /** The currency the role's country charges in, preselected on the form. */
  defaultCurrency?: string;
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

export function AmendRateForm({ roleId, roleName, defaultCurrency }: Props) {
  const t = usePortalT();

  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currency: defaultCurrency ?? initialState.currency,
  });
  const symbol = currencySymbol(state.currency);

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

    try {
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
    } catch {
      dispatch({ type: "error", error: "Could not complete the operation. Please try again." });
    }
  }

  return (
    <form aria-busy={state.pending} onSubmit={handleSubmit} className="space-y-4 text-sm">
      <p className="text-ink"><Tr>{"Amend rates for"}</Tr><span className="font-medium text-heading">{roleName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-ink"><Tr>{"Client charge rate ("}</Tr>{symbol}<Tr>{"/hr)"}</Tr><RequiredMark /><input
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
          <label className="flex flex-col gap-1 text-ink"><Tr>{"Professional payout rate ("}</Tr>{symbol}<Tr>{"/hr)"}</Tr><RequiredMark /><input
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

        <div className="flex flex-col gap-1 text-ink"><Tr>{"Platform fee type"}</Tr><Select
            aria-label={t("Platform fee type")}
            value={state.platformFeeType}
            onValueChange={(v) => dispatch({ type: "set", field: "platformFeeType", value: v as PlatformFeeType })}
            options={[
              { value: "derived", label: t("Derived (enter payout directly)") },
              { value: "percentage", label: t("Percentage of charge") },
              { value: "fixed", label: t("Fixed ({symbol}/hr)", { symbol }) },
            ]}
          />
        </div>

        {showFeeValue && (
          <label className="flex flex-col gap-1 text-ink">
            {state.platformFeeType === "percentage" ? t("Platform fee (%)") : t("Platform fee ({symbol}/hr)", { symbol })}
            <RequiredMark /><input
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

        <div className="flex flex-col gap-1 text-ink"><Tr>{"Currency"}</Tr><Select
            aria-label={t("Currency")}
            value={state.currency}
            onValueChange={(v) => dispatch({ type: "set", field: "currency", value: v })}
            options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {preview &&
        (preview.ok ? (
          <p className="text-sm text-ink"><Tr>{"Professional payout will be"}</Tr>{" "}
            <span className="font-semibold text-heading">
              {formatRate(preview.rate.professionalPayoutRate, state.currency)}<Tr>{"/hr"}</Tr></span>{" "}<Tr>{"— the platform keeps"}</Tr>{" "}
            {formatRate(
              Number(state.clientChargeRate) - preview.rate.professionalPayoutRate,
              state.currency,
            )}<Tr>{"/hr."}</Tr></p>
        ) : (
          <p className="text-sm text-danger"><Tr>{preview.error}</Tr></p>
        ))}

      {state.error && <p role="alert" className="text-sm text-danger"><Tr>{state.error}</Tr></p>}

      <button
        type="submit"
        disabled={state.pending}
        className="rounded-full bg-brand-strong px-4 py-1.5 text-white hover:bg-brand-strong-hover disabled:opacity-50"
      >
        <Tr>{state.pending ? "Saving…" : "Amend rate card"}</Tr>
      </button>
    </form>
  );
}
