import "server-only";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { ensureProfessional } from "./professional-session";
import { eligibilityCompleted, assessmentPassed, profileComplete } from "./progress";
import { onboardingRedirect, type OnboardingStep } from "./gate";

/**
 * Server guard for an onboarding page. Redirects a professional who reaches a
 * step out of order back to the earliest step they still owe, so the
 * registration form can't be opened before eligibility + the assessment
 * (spec §1–3). Mirrors the action-level checks in onboarding/actions.ts.
 */
export async function guardOnboardingStep(target: OnboardingStep): Promise<void> {
  const professionalId = await ensureProfessional();
  if (!professionalId) redirect("/login");

  const admin = createServiceClient();
  const [eligible, assessed, profiled] = await Promise.all([
    eligibilityCompleted(admin, professionalId),
    assessmentPassed(admin, professionalId),
    profileComplete(admin, professionalId),
  ]);

  const to = onboardingRedirect(target, {
    eligibilitySubmitted: eligible,
    assessmentPassed: assessed,
    profileComplete: profiled,
  });
  if (to) redirect(to);
}
