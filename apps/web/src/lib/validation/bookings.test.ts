import { describe, it, expect } from "vitest";
import { createBookingSchema, MAX_SHIFT_HOURS } from "./bookings";

describe("createBookingSchema", () => {
  const valid = {
    requesterType: "client" as const,
    professionalRoleId: "550e8400-e29b-41d4-a716-446655440000",
    scheduledStart: "2026-07-01T09:00:00.000Z",
    scheduledEnd: "2026-07-01T11:00:00.000Z",
    locationAddress: "123 Care Lane",
  };

  it("accepts a minimal valid booking", () => {
    expect(createBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("requires requesterType", () => {
    expect(createBookingSchema.safeParse({ ...valid, requesterType: undefined }).success).toBe(false);
  });

  it("requires a valid role uuid", () => {
    expect(createBookingSchema.safeParse({ ...valid, professionalRoleId: "not-a-uuid" }).success).toBe(false);
  });

  it("requires ISO datetimes", () => {
    expect(createBookingSchema.safeParse({ ...valid, scheduledStart: "tomorrow" }).success).toBe(false);
  });

  it("requires a non-empty location address", () => {
    expect(createBookingSchema.safeParse({ ...valid, locationAddress: "" }).success).toBe(false);
  });

  it("rejects an end time before the start time", () => {
    expect(
      createBookingSchema.safeParse({
        ...valid,
        scheduledStart: "2026-07-01T11:00:00.000Z",
        scheduledEnd: "2026-07-01T09:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it(`accepts a shift up to the ${MAX_SHIFT_HOURS}-hour maximum`, () => {
    expect(
      createBookingSchema.safeParse({
        ...valid,
        scheduledStart: "2026-07-01T09:00:00.000Z",
        scheduledEnd: "2026-07-02T09:00:00.000Z", // exactly 24h
      }).success,
    ).toBe(true);
  });

  it(`rejects a shift longer than ${MAX_SHIFT_HOURS} hours`, () => {
    expect(
      createBookingSchema.safeParse({
        ...valid,
        scheduledStart: "2026-07-01T09:00:00.000Z",
        scheduledEnd: "2026-07-02T10:00:00.000Z", // 25h
      }).success,
    ).toBe(false);
  });

  it("accepts optional postcode and notes", () => {
    expect(
      createBookingSchema.safeParse({
        ...valid,
        locationPostcode: "SW1A 1AA",
        notes: "Ring the bell",
      }).success,
    ).toBe(true);
  });
});
