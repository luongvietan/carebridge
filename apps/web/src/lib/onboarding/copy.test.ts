import { describe, expect, it } from "vitest";
import { onboardingCopy } from "./copy";
import { employmentStatuses, mandatoryTrainingItems } from "@/lib/validation/onboarding";
import { DAYS_OF_WEEK } from "./profile-children";

/** The same keys, at every depth, in both languages. */
function shape(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
  }
  return typeof v;
}

describe("onboarding copy", () => {
  it("has the same shape in English and Portuguese", () => {
    expect(shape(onboardingCopy["pt-PT"])).toEqual(shape(onboardingCopy["en-GB"]));
  });

  it("translates every employment status and training item the schema defines", () => {
    for (const locale of ["en-GB", "pt-PT"] as const) {
      const e = onboardingCopy[locale].eligibility;
      for (const s of employmentStatuses) expect(e.employment[s], `${locale} ${s}`).toBeTruthy();
      for (const t of mandatoryTrainingItems) expect(e.training[t.key], `${locale} ${t.key}`).toBeTruthy();
    }
  });

  it("names all seven days in both languages", () => {
    for (const locale of ["en-GB", "pt-PT"] as const) {
      expect(onboardingCopy[locale].profile.days).toHaveLength(DAYS_OF_WEEK.length);
    }
  });
});
