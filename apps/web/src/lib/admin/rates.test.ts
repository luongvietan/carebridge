import { describe, it, expect } from "vitest";
import { validateRateAmendment } from "./rates";

const base = { clientChargeRate: 40, professionalPayoutRate: 28, platformFeeType: "derived" as const, platformFeeValue: null, currency: "GBP" };

describe("validateRateAmendment", () => {
  it("accepts a valid derived rate", () => {
    expect(validateRateAmendment(base).ok).toBe(true);
  });
  it("rejects charge below payout (margin)", () => {
    expect(validateRateAmendment({ ...base, clientChargeRate: 20 }).ok).toBe(false);
  });
  it("requires a fee value for fixed/percentage", () => {
    expect(validateRateAmendment({ ...base, platformFeeType: "fixed", platformFeeValue: null }).ok).toBe(false);
    expect(validateRateAmendment({ ...base, platformFeeType: "percentage", platformFeeValue: 30 }).ok).toBe(true);
  });
  it("rejects negative rates", () => {
    expect(validateRateAmendment({ ...base, professionalPayoutRate: -1, clientChargeRate: -1 }).ok).toBe(false);
  });
});
