import { onboardingCopy } from "@/lib/onboarding/copy";
import { getOnboardingLocale } from "@/lib/onboarding/locale";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getOnboardingLocale();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{onboardingCopy[locale].joinTitle}</h1>
      <div className="mt-8">{children}</div>
    </main>
  );
}
