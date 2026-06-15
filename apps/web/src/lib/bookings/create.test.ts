import { describe, it, expect } from "vitest";
import { buildBookingInsert, hoursBetween } from "./create";
import type { RateCard } from "@/lib/rates/snapshot";

const rc: RateCard = {
  id: "rc1",
  client_charge_rate: 40,
  professional_payout_rate: 28,
  platform_fee_type: "derived",
  platform_fee_value: null,
  currency: "GBP",
};

const input = {
  requesterUserId: "u1",
  privateClientId: "c1",
  organisationId: null,
  professionalRoleId: "role1",
  scheduledStart: "2026-07-01T09:00:00.000Z",
  scheduledEnd: "2026-07-01T17:00:00.000Z",
  locationAddress: "1 Test St",
  locationPostcode: "E1 6AN",
  notes: null,
};

describe("hoursBetween", () => {
  it("computes fractional hours", () => {
    expect(hoursBetween("2026-07-01T09:00:00Z", "2026-07-01T12:30:00Z")).toBe(3.5);
  });
});

describe("buildBookingInsert", () => {
  it("builds an open open-market booking with snapshot and duration", () => {
    const b = buildBookingInsert(input, rc);
    expect(b).toMatchObject({
      requester_user_id: "u1",
      private_client_id: "c1",
      organisation_id: null,
      professional_role_id: "role1",
      rate_card_id: "rc1",
      duration_hours: 8,
      snap_client_charge_rate: 40,
      snap_payout_rate: 28,
      snap_platform_fee: 12,
      booking_type: "open_market",
      status: "open",
    });
  });
  it("requires exactly one of client/org", () => {
    expect(() => buildBookingInsert({ ...input, organisationId: "o1" }, rc)).toThrow();
    expect(() => buildBookingInsert({ ...input, privateClientId: null, organisationId: null }, rc)).toThrow();
  });
  it("rejects a non-positive window", () => {
    expect(() => buildBookingInsert({ ...input, scheduledEnd: input.scheduledStart }, rc)).toThrow();
  });
});
