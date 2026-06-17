export type OnboardingStep = "eligibility" | "assessment" | "profile" | "documents";

export type OnboardingProgress = {
  eligibilitySubmitted: boolean;
  assessmentPassed: boolean;
  profileComplete: boolean;
};

const ELIGIBILITY = "/professional/onboarding/eligibility";
const ASSESSMENT = "/professional/onboarding/assessment";
const PROFILE = "/professional/onboarding/profile";

/**
 * Where to send a professional who tries to view `target` out of order, or null
 * if they may view it. Enforces the eligibility → assessment → profile →
 * documents order from spec §1–3 ("Before accessing the registration form ...
 * complete eligibility screening"; "Assessment must be passed before the
 * application can be submitted"). Pure so the page guard can be unit-tested.
 */
export function onboardingRedirect(
  target: OnboardingStep,
  p: OnboardingProgress,
): string | null {
  if (target === "eligibility") return null;
  if (!p.eligibilitySubmitted) return ELIGIBILITY;
  if (target === "assessment") return null;
  if (!p.assessmentPassed) return ASSESSMENT;
  if (target === "documents" && !p.profileComplete) return PROFILE;
  return null;
}
