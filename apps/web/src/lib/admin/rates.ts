export type PlatformFeeType = "derived" | "percentage" | "fixed";

export type NewRate = {
  clientChargeRate: number;
  professionalPayoutRate: number;
  platformFeeType: PlatformFeeType;
  platformFeeValue: number | null;
  currency: string;
};

// The MVP is a UK-only platform (multi-country support is an explicit Phase 2
// item) and all money is displayed/charged in GBP, so reject any other currency
// rather than silently mislabelling amounts as "£".
export const SUPPORTED_CURRENCIES = ["GBP"] as const;

export function validateRateAmendment(r: NewRate): { ok: true; rate: NewRate } | { ok: false; error: string } {
  if (r.clientChargeRate < 0 || r.professionalPayoutRate < 0) return { ok: false, error: "Rates cannot be negative." };
  if (r.clientChargeRate < r.professionalPayoutRate) return { ok: false, error: "Client charge must be at least the professional payout." };
  if (r.platformFeeType !== "derived" && (r.platformFeeValue == null || r.platformFeeValue < 0)) {
    return { ok: false, error: "A non-negative fee value is required for fixed or percentage fees." };
  }
  if (!SUPPORTED_CURRENCIES.includes(r.currency as (typeof SUPPORTED_CURRENCIES)[number])) {
    return { ok: false, error: `Unsupported currency "${r.currency}". Only ${SUPPORTED_CURRENCIES.join(", ")} is supported.` };
  }
  return { ok: true, rate: r };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export type RateAmendmentInput = {
  clientChargeRate: number;
  platformFeeType: PlatformFeeType;
  platformFeeValue: number | null;
  /** Only used (and required) when platformFeeType is "derived". */
  professionalPayoutRate?: number | null;
  currency: string;
};

/**
 * Resolve a rate amendment where the platform fee DRIVES the payout:
 * - percentage: payout = charge − (charge × fee%)
 * - fixed:      payout = charge − fee (a fixed £/hr platform fee)
 * - derived:    admin enters the payout directly; the fee is the resulting margin
 *
 * Because payout = charge − fee, the reported platform revenue (charge − payout)
 * always equals the configured fee — the fee is no longer decorative.
 */
export function resolveRateAmendment(
  input: RateAmendmentInput,
): { ok: true; rate: NewRate } | { ok: false; error: string } {
  const charge = input.clientChargeRate;
  if (!Number.isFinite(charge) || charge < 0) {
    return { ok: false, error: "Client charge rate must be a non-negative number." };
  }

  let payout: number;
  let feeValue: number | null = null;

  if (input.platformFeeType === "percentage") {
    const v = input.platformFeeValue;
    if (v == null || !Number.isFinite(v) || v < 0 || v > 100) {
      return { ok: false, error: "Percentage fee must be between 0 and 100." };
    }
    payout = round2(charge - round2((charge * v) / 100));
    feeValue = v;
  } else if (input.platformFeeType === "fixed") {
    const v = input.platformFeeValue;
    if (v == null || !Number.isFinite(v) || v < 0) {
      return { ok: false, error: "Fixed fee must be a non-negative amount." };
    }
    if (v > charge) {
      return { ok: false, error: "Fixed fee per hour cannot exceed the client charge rate." };
    }
    payout = round2(charge - v);
    feeValue = v;
  } else {
    const p = input.professionalPayoutRate;
    if (p == null || !Number.isFinite(p) || p < 0) {
      return { ok: false, error: "A non-negative professional payout rate is required." };
    }
    if (p > charge) {
      return { ok: false, error: "Client charge must be at least the professional payout." };
    }
    payout = round2(p);
  }

  // Final guard reuses the canonical invariant checks.
  return validateRateAmendment({
    clientChargeRate: round2(charge),
    professionalPayoutRate: payout,
    platformFeeType: input.platformFeeType,
    platformFeeValue: feeValue,
    currency: input.currency,
  });
}
