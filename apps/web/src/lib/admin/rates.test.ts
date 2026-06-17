import { describe, it, expect } from "vitest";
import { validateRateAmendment, resolveRateAmendment } from "./rates";

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
  it("rejects unsupported currencies (UK-only MVP)", () => {
    expect(validateRateAmendment({ ...base, currency: "EUR" }).ok).toBe(false);
    expect(validateRateAmendment({ ...base, currency: "gbp" }).ok).toBe(false);
    expect(validateRateAmendment({ ...base, currency: "GBP" }).ok).toBe(true);
  });
});

describe("resolveRateAmendment", () => {
  it("derives payout from a percentage fee (charge − charge×fee%)", () => {
    const r = resolveRateAmendment({
      clientChargeRate: 40,
      platformFeeType: "percentage",
      platformFeeValue: 30,
      currency: "GBP",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rate.professionalPayoutRate).toBe(28);
  });

  it("derives payout from a fixed per-hour fee (charge − fee)", () => {
    const r = resolveRateAmendment({
      clientChargeRate: 40,
      platformFeeType: "fixed",
      platformFeeValue: 5,
      currency: "GBP",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rate.professionalPayoutRate).toBe(35);
  });

  it("uses the entered payout for a derived fee", () => {
    const r = resolveRateAmendment({
      clientChargeRate: 40,
      platformFeeType: "derived",
      professionalPayoutRate: 28,
      platformFeeValue: null,
      currency: "GBP",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.rate.professionalPayoutRate).toBe(28);
  });

  it("rejects a percentage outside 0–100", () => {
    expect(
      resolveRateAmendment({ clientChargeRate: 40, platformFeeType: "percentage", platformFeeValue: 120, currency: "GBP" }).ok,
    ).toBe(false);
  });

  it("rejects a fixed fee that exceeds the client charge", () => {
    expect(
      resolveRateAmendment({ clientChargeRate: 40, platformFeeType: "fixed", platformFeeValue: 50, currency: "GBP" }).ok,
    ).toBe(false);
  });

  it("rejects a derived payout above the client charge", () => {
    expect(
      resolveRateAmendment({ clientChargeRate: 40, platformFeeType: "derived", professionalPayoutRate: 50, platformFeeValue: null, currency: "GBP" }).ok,
    ).toBe(false);
  });

  it("rejects an unsupported currency", () => {
    expect(
      resolveRateAmendment({ clientChargeRate: 40, platformFeeType: "percentage", platformFeeValue: 10, currency: "USD" }).ok,
    ).toBe(false);
  });
});
