import { getAccountCountry } from "@/lib/accounts/market-server";
import { EligibilityForm } from "@/components/eligibility-form";
import { getOnboardingLocale } from "@/lib/onboarding/locale";

export default async function EligibilityPage() {
  return <EligibilityForm locale={await getOnboardingLocale()} country={await getAccountCountry()} />;
}
