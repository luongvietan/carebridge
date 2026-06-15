import { describe, it, expect } from "vitest";
import { paymentStatusForEvent } from "./events";

describe("paymentStatusForEvent", () => {
  it("maps success events to succeeded", () => {
    expect(paymentStatusForEvent("payment_intent.succeeded")).toBe("succeeded");
  });
  it("maps failure to failed and refund to refunded", () => {
    expect(paymentStatusForEvent("payment_intent.payment_failed")).toBe("failed");
    expect(paymentStatusForEvent("charge.refunded")).toBe("refunded");
  });
  it("returns null for unhandled events", () => {
    expect(paymentStatusForEvent("invoice.paid")).toBeNull();
    expect(paymentStatusForEvent("checkout.session.completed")).toBeNull();
  });
});
