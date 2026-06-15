import { describe, it, expect } from "vitest";
import { buildCheckoutLineItems } from "./checkout";

describe("buildCheckoutLineItems", () => {
  it("converts the client charge to pence and lowercases currency", () => {
    const items = buildCheckoutLineItems({ total_client_charge: 320, snap_currency: "GBP", role_name: "Registered Nurse" });
    expect(items).toEqual([
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: 32000,
          product_data: { name: "Booking — Registered Nurse" },
        },
      },
    ]);
  });
  it("rounds fractional pounds to the nearest penny", () => {
    const items = buildCheckoutLineItems({ total_client_charge: 12.345, snap_currency: "GBP", role_name: "Carer" });
    expect(items[0].price_data.unit_amount).toBe(1235);
  });
});
