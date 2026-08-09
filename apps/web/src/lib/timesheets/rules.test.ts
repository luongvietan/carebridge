import { describe, it, expect } from "vitest";
import {
  autoConfirmCutoff,
  checkSubmittedHours,
  hoursDifferFromBooking,
  isAutoConfirmable,
  payoutGate,
  workedHours,
} from "./rules";

describe("workedHours", () => {
  it("deducts unpaid breaks", () => {
    expect(
      workedHours({
        actualStart: "2026-08-05T08:00:00Z",
        actualEnd: "2026-08-05T16:30:00Z",
        breakMinutes: 30,
      }),
    ).toBe(8);
  });
  it("rounds to two decimals", () => {
    expect(
      workedHours({
        actualStart: "2026-08-05T08:00:00Z",
        actualEnd: "2026-08-05T12:20:00Z",
        breakMinutes: 0,
      }),
    ).toBe(4.33);
  });
});

describe("checkSubmittedHours", () => {
  const now = new Date("2026-08-06T12:00:00Z");
  const base = {
    actualStart: "2026-08-05T08:00:00Z",
    actualEnd: "2026-08-05T16:00:00Z",
    breakMinutes: 0,
    scheduledEnd: "2026-08-05T16:00:00Z",
    bookedHours: 8,
    now,
  };

  it("accepts hours matching the booking", () => {
    expect(checkSubmittedHours(base)).toEqual({ ok: true });
  });
  it("accepts a shift that overran modestly", () => {
    expect(
      checkSubmittedHours({ ...base, actualEnd: "2026-08-05T17:30:00Z" }),
    ).toEqual({ ok: true });
  });
  it("rejects a finish before the start", () => {
    expect(checkSubmittedHours({ ...base, actualEnd: "2026-08-05T07:00:00Z" }).ok).toBe(false);
  });
  it("rejects hours logged for a shift that has not finished", () => {
    const r = checkSubmittedHours({
      ...base,
      scheduledEnd: "2026-08-07T16:00:00Z",
      actualStart: "2026-08-06T08:00:00Z",
      actualEnd: "2026-08-06T11:00:00Z",
    });
    expect(r).toEqual({ ok: false, error: "This shift has not finished yet." });
  });
  it("rejects a finish time in the future", () => {
    expect(
      checkSubmittedHours({ ...base, actualEnd: "2026-08-06T18:00:00Z" }).ok,
    ).toBe(false);
  });
  it("rejects a break longer than the shift", () => {
    expect(checkSubmittedHours({ ...base, breakMinutes: 600 }).ok).toBe(false);
  });
  it("rejects a claim of more than double the booking", () => {
    const r = checkSubmittedHours({
      ...base,
      actualStart: "2026-08-05T00:00:00Z",
      actualEnd: "2026-08-05T20:00:00Z",
    });
    expect(r.ok).toBe(false);
  });
  it("rejects a shift beyond the 24-hour ceiling", () => {
    const r = checkSubmittedHours({
      ...base,
      actualStart: "2026-08-04T08:00:00Z",
      actualEnd: "2026-08-05T09:00:00Z",
      bookedHours: 24,
    });
    expect(r.ok).toBe(false);
  });
});

describe("hoursDifferFromBooking", () => {
  it("ignores rounding-level differences", () => {
    expect(hoursDifferFromBooking(8, 8.1)).toBe(false);
  });
  it("flags a quarter of an hour or more", () => {
    expect(hoursDifferFromBooking(8.25, 8)).toBe(true);
    expect(hoursDifferFromBooking(7, 8)).toBe(true);
  });
});

describe("autoConfirmCutoff", () => {
  it("counts three working days back from a Thursday", () => {
    // Thursday 6 Aug 2026 → Wednesday, Tuesday, Monday.
    expect(autoConfirmCutoff(new Date("2026-08-06T09:00:00Z")).toISOString().slice(0, 10)).toBe(
      "2026-08-03",
    );
  });
  it("skips the weekend, so a Friday submission is not confirmed on Monday", () => {
    // Tuesday 11 Aug 2026 → Monday, Friday, Thursday: a Friday submission is
    // still inside its window on the Tuesday.
    expect(autoConfirmCutoff(new Date("2026-08-11T09:00:00Z")).toISOString().slice(0, 10)).toBe(
      "2026-08-06",
    );
  });
});

describe("payoutGate", () => {
  it("lets a legacy booking through when no timesheet is required", () => {
    expect(payoutGate(null, false)).toEqual({ ok: true });
  });

  it("holds the payout until hours are submitted", () => {
    const gate = payoutGate(null, true);
    expect(gate.ok).toBe(false);
    expect(gate).toMatchObject({ reason: expect.stringMatching(/not submitted/i) });
  });

  it("holds the payout while the hours are only submitted", () => {
    expect(payoutGate({ status: "submitted" }, true).ok).toBe(false);
  });

  it("holds the payout while a query is open — the client's 10 Aug rule", () => {
    const gate = payoutGate({ status: "disputed" }, true);
    expect(gate.ok).toBe(false);
    expect(gate).toMatchObject({ reason: expect.stringMatching(/under query/i) });
  });

  it("releases once the hours are confirmed", () => {
    expect(payoutGate({ status: "confirmed" }, true)).toEqual({ ok: true });
  });
});

describe("isAutoConfirmable", () => {
  it("only picks up hours still awaiting an answer", () => {
    expect(isAutoConfirmable("submitted")).toBe(true);
  });
  it("never auto-confirms a queried sheet, so a dispute pauses the clock", () => {
    expect(isAutoConfirmable("disputed")).toBe(false);
  });
  it("does not re-confirm an already confirmed sheet", () => {
    expect(isAutoConfirmable("confirmed")).toBe(false);
  });
});
