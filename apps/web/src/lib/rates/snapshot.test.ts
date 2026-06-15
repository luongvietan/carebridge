import { describe, it, expect } from "vitest";
import { buildSnapshot } from "./snapshot";

const base = {
  id: "rc1",
  client_charge_rate: 40,
  professional_payout_rate: 28,
  currency: "GBP",
} as const;

describe("buildSnapshot", () => {
  it("derives platform fee (charge - payout)", () => {
    const s = buildSnapshot({ ...base, platform_fee_type: "derived", platform_fee_value: null });
    expect(s).toMatchObject({
      rate_card_id: "rc1",
      snap_client_charge_rate: 40,
      snap_payout_rate: 28,
      snap_platform_fee: 12,
      snap_currency: "GBP",
    });
  });
  it("uses an explicit fixed fee", () => {
    const s = buildSnapshot({ ...base, platform_fee_type: "fixed", platform_fee_value: 5 });
    expect(s.snap_platform_fee).toBe(5);
  });
  it("computes a percentage fee", () => {
    const s = buildSnapshot({ ...base, platform_fee_type: "percentage", platform_fee_value: 30 });
    expect(s.snap_platform_fee).toBe(12); // 40 * 30 / 100
  });
});
