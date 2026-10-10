// Carbon-style step indicator for the professional onboarding wizard.
import { onboardingCopy, type OnboardingLocale } from "@/lib/onboarding/copy";

export function OnboardingSteps({
  current,
  locale = "en-GB",
}: {
  current: number;
  locale?: OnboardingLocale;
}) {
  const STEPS = onboardingCopy[locale].steps;
  return (
    <ol className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4 border border-line bg-line text-sm">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`flex-1 px-4 py-3 ${
              active ? "bg-white font-semibold text-brand-strong" : done ? "bg-white text-heading" : "bg-surface text-muted"
            }`}
          >
            <span className="tabular-nums">{done ? "✓" : step}.</span> {label}
          </li>
        );
      })}
    </ol>
  );
}
