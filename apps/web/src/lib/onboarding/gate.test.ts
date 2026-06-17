import { describe, it, expect } from "vitest";
import { onboardingRedirect } from "./gate";

const ELIGIBILITY = "/professional/onboarding/eligibility";
const ASSESSMENT = "/professional/onboarding/assessment";
const PROFILE = "/professional/onboarding/profile";

const none = { eligibilitySubmitted: false, assessmentPassed: false, profileComplete: false };
const eligible = { eligibilitySubmitted: true, assessmentPassed: false, profileComplete: false };
const assessed = { eligibilitySubmitted: true, assessmentPassed: true, profileComplete: false };
const profiled = { eligibilitySubmitted: true, assessmentPassed: true, profileComplete: true };

describe("onboardingRedirect", () => {
  it("always allows the eligibility step", () => {
    expect(onboardingRedirect("eligibility", none)).toBeNull();
    expect(onboardingRedirect("eligibility", profiled)).toBeNull();
  });

  it("sends a user to eligibility before any later step until it is submitted", () => {
    expect(onboardingRedirect("assessment", none)).toBe(ELIGIBILITY);
    expect(onboardingRedirect("profile", none)).toBe(ELIGIBILITY);
    expect(onboardingRedirect("documents", none)).toBe(ELIGIBILITY);
  });

  it("allows the assessment once eligibility is submitted", () => {
    expect(onboardingRedirect("assessment", eligible)).toBeNull();
  });

  it("blocks profile and documents until the assessment is passed", () => {
    expect(onboardingRedirect("profile", eligible)).toBe(ASSESSMENT);
    expect(onboardingRedirect("documents", eligible)).toBe(ASSESSMENT);
  });

  it("allows the profile once the assessment is passed", () => {
    expect(onboardingRedirect("profile", assessed)).toBeNull();
  });

  it("blocks documents until the profile (role) is complete", () => {
    expect(onboardingRedirect("documents", assessed)).toBe(PROFILE);
  });

  it("allows documents once eligibility, assessment and profile are complete", () => {
    expect(onboardingRedirect("documents", profiled)).toBeNull();
  });
});
