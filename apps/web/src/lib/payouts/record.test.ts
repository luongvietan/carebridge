import { describe, it, expect } from "vitest";
import { nextPayoutStatus, netPayoutAmount } from "./record";

describe("nextPayoutStatus", () => {
  it("records a pending payout", () => expect(nextPayoutStatus("pending", "record")).toBe("recorded"));
  it("marks a recorded payout paid", () => expect(nextPayoutStatus("recorded", "mark_paid")).toBe("paid"));
  it("throws on an illegal transition", () => {
    expect(() => nextPayoutStatus("pending", "mark_paid")).toThrow();
    expect(() => nextPayoutStatus("paid", "record")).toThrow();
  });
});

describe("netPayoutAmount", () => {
  it("returns the full payout when nothing is refunded", () => {
    expect(netPayoutAmount(100, 0)).toBe(100);
  });
  it("deducts a partial refund from the payout", () => {
    expect(netPayoutAmount(100, 40)).toBe(60);
  });
  it("never goes negative when the refund exceeds the payout", () => {
    expect(netPayoutAmount(100, 150)).toBe(0);
  });
  it("rounds to 2 decimals", () => {
    expect(netPayoutAmount(100.005, 0)).toBe(100.01);
    expect(netPayoutAmount(99.999, 33.333)).toBe(66.67);
  });
  it("treats a null/undefined refund as zero", () => {
    expect(netPayoutAmount(80, undefined as unknown as number)).toBe(80);
  });
});
