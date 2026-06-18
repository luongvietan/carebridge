import { describe, it, expect } from "vitest";
import { paymentStatusForEvent, refundInfoFromCharge } from "./events";

describe("paymentStatusForEvent", () => {
  it("maps success events to succeeded", () => {
    expect(paymentStatusForEvent("checkout.session.completed")).toBe("succeeded");
    expect(paymentStatusForEvent("payment_intent.succeeded")).toBe("succeeded");
  });
  it("maps failure to failed and refund to refunded", () => {
    expect(paymentStatusForEvent("payment_intent.payment_failed")).toBe("failed");
    expect(paymentStatusForEvent("charge.refunded")).toBe("refunded");
  });
  it("returns null for unhandled events", () => {
    expect(paymentStatusForEvent("invoice.paid")).toBeNull();
  });
});

describe("refundInfoFromCharge", () => {
  it("flags a full refund when Stripe marks the charge refunded", () => {
    const r = refundInfoFromCharge({ amount_captured: 12000, amount_refunded: 12000, refunded: true });
    expect(r.isFullRefund).toBe(true);
    expect(r.refundedAmount).toBe(120);
  });
  it("flags a full refund when the cumulative amount covers the capture", () => {
    expect(refundInfoFromCharge({ amount_captured: 12000, amount_refunded: 12000 }).isFullRefund).toBe(true);
  });
  it("treats a partial refund as not full (payout stays unfrozen)", () => {
    const r = refundInfoFromCharge({ amount_captured: 12000, amount_refunded: 1000, refunded: false });
    expect(r.isFullRefund).toBe(false);
    expect(r.refundedAmount).toBe(10);
  });
  it("falls back to `amount` when amount_captured is absent", () => {
    expect(refundInfoFromCharge({ amount: 5000, amount_refunded: 5000 }).isFullRefund).toBe(true);
  });
});
