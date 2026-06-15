export type PlatformFeeType = "derived" | "percentage" | "fixed";

export type NewRate = {
  clientChargeRate: number;
  professionalPayoutRate: number;
  platformFeeType: PlatformFeeType;
  platformFeeValue: number | null;
  currency: string;
};

export function validateRateAmendment(r: NewRate): { ok: true; rate: NewRate } | { ok: false; error: string } {
  if (r.clientChargeRate < 0 || r.professionalPayoutRate < 0) return { ok: false, error: "Rates cannot be negative." };
  if (r.clientChargeRate < r.professionalPayoutRate) return { ok: false, error: "Client charge must be at least the professional payout." };
  if (r.platformFeeType !== "derived" && (r.platformFeeValue == null || r.platformFeeValue < 0)) {
    return { ok: false, error: "A non-negative fee value is required for fixed or percentage fees." };
  }
  return { ok: true, rate: r };
}
