import "server-only";
import { getAccountCountry } from "@/lib/accounts/market-server";
import type { OnboardingLocale } from "@/lib/onboarding/copy";

/** Onboarding follows stored country, then immutable signup snapshot, then legacy GB. */
export async function getOnboardingLocale(): Promise<OnboardingLocale> {
  return (await getAccountCountry()) === "PT" ? "pt-PT" : "en-GB";
}
