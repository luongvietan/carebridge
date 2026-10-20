import "server-only";
import { getPreferredLocale } from "@/lib/i18n/preference-server";
import type { OnboardingLocale } from "@/lib/onboarding/copy";

/** Onboarding follows stored country, then immutable signup snapshot, then legacy GB. */
export async function getOnboardingLocale(): Promise<OnboardingLocale> {
  return getPreferredLocale();
}
