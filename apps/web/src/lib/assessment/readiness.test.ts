import { describe, expect, it } from "vitest";
import { assessmentBankReady, roleAttemptReady } from "./readiness";

describe("assessment bank coverage", () => {
  it("requires twenty common questions before a role is selected", () => {
    expect(assessmentBankReady(19)).toBe(false);
    expect(assessmentBankReady(20)).toBe(true);
  });
  it("admits the Portugal pilot with twenty common questions without specialist banks", () => {
    expect(assessmentBankReady(20)).toBe(true);
    expect(assessmentBankReady(15)).toBe(false);
    expect(assessmentBankReady(14)).toBe(false);
  });
  it("accepts only twenty Portugal common questions for pilot attempts", () => {
    const common = Array.from({ length: 15 }, () => ({ country_code: "PT", professional_role_id: null }));
    const specialist = Array.from({ length: 5 }, () => ({ country_code: "PT", professional_role_id: "nurse" }));
    expect(roleAttemptReady([...common, ...specialist])).toBe(false);
    expect(roleAttemptReady([...common, ...common.slice(0, 5)])).toBe(true);
    expect(roleAttemptReady([...common, ...specialist])).toBe(false);
    expect(roleAttemptReady([...common, ...specialist].map(q => ({ ...q, country_code: "GB" })))).toBe(false);
    expect(roleAttemptReady([...common, ...specialist.slice(0, 4)])).toBe(false);
  });
});
