import { describe, it, expect } from "vitest";
import { reinstateOutcome } from "./reinstate-compliance";

describe("reinstateOutcome", () => {
  it("restores an activatable professional to active + approved so they can accept bookings", () => {
    expect(reinstateOutcome({ activatable: true, documentsCompliant: true })).toEqual({
      professionalStatus: "active",
      complianceStatus: "approved",
    });
  });

  it("keeps a professional booking-restricted when a required document lapsed during suspension", () => {
    // e.g. DBS / insurance expired while suspended — must NOT regain booking ability on reinstate
    expect(reinstateOutcome({ activatable: false, documentsCompliant: false })).toEqual({
      professionalStatus: "booking_restricted",
      complianceStatus: "compliance_expired",
    });
  });

  it("flags further-info-required when documents are complete but activation is still blocked", () => {
    expect(reinstateOutcome({ activatable: false, documentsCompliant: true })).toEqual({
      professionalStatus: "booking_restricted",
      complianceStatus: "further_info_required",
    });
  });
});
