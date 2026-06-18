import { describe, it, expect } from "vitest";
import { buildProfessionalFilters } from "./search";

describe("buildProfessionalFilters", () => {
  it("drops empty/blank criteria", () => {
    expect(buildProfessionalFilters({ text: "  ", professionalStatus: "", minTravelKm: "" })).toEqual({});
  });
  it("trims text and coerces minTravelKm", () => {
    expect(buildProfessionalFilters({ text: " jane ", minTravelKm: "25" })).toEqual({ text: "jane", minTravelKm: 25 });
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
    expect(buildProfessionalFilters({ minTravelKm: "0" })).toEqual({});
    expect(buildProfessionalFilters({ minTravelKm: "abc" })).toEqual({});
  });
  it("drops invalid status enums so a bad query param cannot crash the query", () => {
    expect(
      buildProfessionalFilters({ professionalStatus: "xyz", complianceStatus: "nope" }),
    ).toEqual({});
  });
  it("accepts a valid availability day and ignores invalid ones", () => {
    expect(buildProfessionalFilters({ availabilityDay: "3" })).toEqual({ availabilityDay: 3 });
    expect(buildProfessionalFilters({ availabilityDay: "0" })).toEqual({ availabilityDay: 0 });
    expect(buildProfessionalFilters({ availabilityDay: "" })).toEqual({});
    expect(buildProfessionalFilters({ availabilityDay: "9" })).toEqual({});
    expect(buildProfessionalFilters({ availabilityDay: "abc" })).toEqual({});
  });
});
