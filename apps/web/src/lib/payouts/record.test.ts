import { describe, it, expect } from "vitest";
import { nextPayoutStatus } from "./record";

describe("nextPayoutStatus", () => {
  it("records a pending payout", () => expect(nextPayoutStatus("pending", "record")).toBe("recorded"));
  it("marks a recorded payout paid", () => expect(nextPayoutStatus("recorded", "mark_paid")).toBe("paid"));
  it("throws on an illegal transition", () => {
    expect(() => nextPayoutStatus("pending", "mark_paid")).toThrow();
    expect(() => nextPayoutStatus("paid", "record")).toThrow();
  });
});
