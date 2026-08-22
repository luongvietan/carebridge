import { describe, it, expect } from "vitest";
import { bookingFinance, moneyState } from "./booking-finance";
import { bookingAnalytics } from "./analytics";

const base = {
  bookingId: "b1",
  totalClientCharge: 320,
  totalPayout: 224,
  bookingStatus: "completed",
};

describe("moneyState", () => {
  it("is pending with no payment yet", () => {
    expect(moneyState({ ...base, payment: null })).toBe("pending");
  });

  it("is pending while the payment is still pending", () => {
    expect(
      moneyState({ ...base, payment: { status: "pending", amount: 320, refundedAmount: 0, refundedAt: null } }),
    ).toBe("pending");
  });

  it("is failed when the payment failed", () => {
    expect(
      moneyState({ ...base, payment: { status: "failed", amount: 320, refundedAmount: 0, refundedAt: null } }),
    ).toBe("failed");
  });

  it("is held once the client has paid but nothing has gone out", () => {
    expect(
      moneyState({ ...base, payment: { status: "succeeded", amount: 320, refundedAmount: 0, refundedAt: null } }),
    ).toBe("held");
  });

  it("is still held while a payout is recorded but not paid", () => {
    expect(
      moneyState({
        ...base,
        payment: { status: "succeeded", amount: 320, refundedAmount: 0, refundedAt: null },
        payout: { status: "recorded", amount: 224 },
      }),
    ).toBe("held");
  });

  it("is released once the payout is paid", () => {
    expect(
      moneyState({
        ...base,
        payment: { status: "succeeded", amount: 320, refundedAmount: 0, refundedAt: null },
        payout: { status: "paid", amount: 224 },
      }),
    ).toBe("released");
  });

  it("distinguishes a full refund from a partial one", () => {
    expect(
      moneyState({
        ...base,
        payment: { status: "refunded", amount: 320, refundedAmount: 320, refundedAt: "2026-08-01T00:00:00Z" },
      }),
    ).toBe("refunded");
    expect(
      moneyState({
        ...base,
        payment: { status: "succeeded", amount: 320, refundedAmount: 40, refundedAt: null },
      }),
    ).toBe("part_refunded");
  });
});

describe("bookingFinance", () => {
  it("splits the charge into payout and platform fee", () => {
    const result = bookingFinance({
      ...base,
      payment: { status: "succeeded", amount: 320, refundedAmount: 0, refundedAt: null },
    });
    expect(result.professionalPayout).toBe(224);
    expect(result.platformFee).toBe(96);
  });

  it("takes a refund out of the platform fee", () => {
    const result = bookingFinance({
      ...base,
      payment: { status: "succeeded", amount: 320, refundedAmount: 40, refundedAt: null },
    });
    expect(result.platformFee).toBe(56);
    expect(result.refunded).toBe(40);
  });

  it("never reports a negative fee", () => {
    const result = bookingFinance({
      ...base,
      payment: { status: "succeeded", amount: 320, refundedAmount: 300, refundedAt: null },
    });
    expect(result.platformFee).toBe(0);
  });
});

describe("bookingAnalytics", () => {
  const now = new Date("2026-08-15T00:00:00Z");
  const bookings = [
    { status: "completed", scheduledStart: "2026-08-01T09:00:00Z", clientCharge: 320 },
    { status: "completed", scheduledStart: "2026-08-05T09:00:00Z", clientCharge: 160 },
    { status: "cancelled", scheduledStart: "2026-08-06T09:00:00Z", clientCharge: 320 },
    { status: "no_show", scheduledStart: "2026-07-20T09:00:00Z", clientCharge: 240 },
    { status: "completed", scheduledStart: "2026-07-02T09:00:00Z", clientCharge: 240 },
    // Still in the future — must not count against the completion rate.
    { status: "open", scheduledStart: "2026-09-01T09:00:00Z", clientCharge: 320 },
  ];

  it("rates only bookings that actually concluded", () => {
    const a = bookingAnalytics(bookings, 6, now);
    expect(a.concluded).toBe(5);
    expect(a.completed).toBe(3);
    expect(a.completionRate).toBe(60);
    expect(a.cancellationRate).toBe(20);
  });

  it("averages the value of completed bookings, per currency", () => {
    const a = bookingAnalytics(bookings, 6, now);
    expect(a.averageBookingValueByCurrency).toEqual({ GBP: 240 });
    expect(
      bookingAnalytics(
        [...bookings, { status: "completed", scheduledStart: "2026-08-07T09:00:00Z", clientCharge: 100, currency: "EUR" }],
        6,
        now,
      ).averageBookingValueByCurrency,
    ).toEqual({ GBP: 240, EUR: 100 });
  });

  it("never sums euro into pounds in a monthly point", () => {
    const mixed = bookingAnalytics(
      [
        { status: "completed", scheduledStart: "2026-08-01T09:00:00Z", clientCharge: 320 },
        { status: "completed", scheduledStart: "2026-08-02T09:00:00Z", clientCharge: 200, currency: "EUR" },
      ],
      3,
      now,
    );
    expect(mixed.monthly.at(-1)?.revenueByCurrency).toEqual({ GBP: 320, EUR: 200 });
  });

  it("reports a month per point, most recent last", () => {
    const a = bookingAnalytics(bookings, 3, now);
    expect(a.monthly.map((m) => m.month)).toEqual(["2026-06", "2026-07", "2026-08"]);
    expect(a.monthly.at(-1)).toMatchObject({ bookings: 3, revenueByCurrency: { GBP: 480 } });
  });

  it("computes month-on-month growth, and returns null with no prior month", () => {
    expect(bookingAnalytics(bookings, 3, now).monthOnMonthGrowth).toBe(50);
    expect(bookingAnalytics([], 3, now).monthOnMonthGrowth).toBeNull();
  });

  it("handles an empty platform without dividing by zero", () => {
    const a = bookingAnalytics([], 6, now);
    expect(a.completionRate).toBe(0);
    expect(a.averageBookingValueByCurrency).toEqual({});
  });
});
