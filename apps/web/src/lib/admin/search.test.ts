import { describe, it, expect } from "vitest";
import { buildProfessionalFilters } from "./search";

describe("buildProfessionalFilters", () => {
  it("drops empty/blank criteria", () => {
    expect(buildProfessionalFilters({ text: "  ", professionalStatus: "", maxTravelKm: "" })).toEqual({});
  });
  it("trims text and coerces maxTravelKm", () => {
    expect(buildProfessionalFilters({ text: " jane ", maxTravelKm: "25" })).toEqual({ text: "jane", maxTravelKm: 25 });
  });
  it("passes through enums, role, postcode, docs", () => {
    expect(
      buildProfessionalFilters({
        professionalStatus: "active", complianceStatus: "approved", roleId: "r1",
        postcode: "E1 6AN ", requireValidDocs: true,
      }),
    ).toEqual({
      professionalStatus: "active", complianceStatus: "approved", roleId: "r1",
      postcode: "E1 6AN", requireValidDocs: true,
    });
  });
  it("ignores non-positive or NaN travel distance", () => {
    expect(buildProfessionalFilters({ maxTravelKm: "0" })).toEqual({});
    expect(buildProfessionalFilters({ maxTravelKm: "abc" })).toEqual({});
  });
  it("accepts a valid availability day and ignores invalid ones", () => {
    expect(buildProfessionalFilters({ availabilityDay: "3" })).toEqual({ availabilityDay: 3 });
    expect(buildProfessionalFilters({ availabilityDay: "0" })).toEqual({ availabilityDay: 0 });
    expect(buildProfessionalFilters({ availabilityDay: "" })).toEqual({});
    expect(buildProfessionalFilters({ availabilityDay: "9" })).toEqual({});
    expect(buildProfessionalFilters({ availabilityDay: "abc" })).toEqual({});
  });
});
