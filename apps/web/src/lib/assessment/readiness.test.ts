import { describe, expect, it } from "vitest";
import { assessmentBankReady, roleAttemptReady } from "./readiness";

describe("assessment bank coverage", () => {
  it("requires twenty common questions before a role is selected", () => {
    expect(assessmentBankReady(19, 5, false)).toBe(false);
    expect(assessmentBankReady(20, 0, false)).toBe(true);
  });
  it("cannot replace specialist questions with common questions", () => {
    expect(assessmentBankReady(20, 0, true)).toBe(false);
    expect(assessmentBankReady(15, 5, true)).toBe(true);
    expect(assessmentBankReady(14, 10, true)).toBe(false);
  });
  it("rejects common-only legacy attempts and questions for another country or role", () => {
    const common = Array.from({ length: 15 }, () => ({ country_code: "PT", professional_role_id: null }));
    const specialist = Array.from({ length: 5 }, () => ({ country_code: "PT", professional_role_id: "nurse" }));
    expect(roleAttemptReady([...common, ...specialist], "nurse")).toBe(true);
    expect(roleAttemptReady([...common, ...common.slice(0, 5)], "nurse")).toBe(false);
    expect(roleAttemptReady([...common, ...specialist], "physio")).toBe(false);
    expect(roleAttemptReady([...common, ...specialist].map(q => ({ ...q, country_code: "GB" })), "nurse")).toBe(false);
    expect(roleAttemptReady([...common, ...specialist.slice(0, 4)], "nurse")).toBe(false);
  });
});
