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
