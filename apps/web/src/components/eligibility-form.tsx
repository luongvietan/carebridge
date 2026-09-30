"use client";
import { useActionState } from "react";
import { ForwardLink } from "@/components/forward-link";
import { submitEligibility, type EligibilityResult } from "@/lib/onboarding/actions";
import { employmentStatuses, mandatoryTrainingItems } from "@/lib/validation/onboarding";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { onboardingCopy, type OnboardingLocale } from "@/lib/onboarding/copy";

export function EligibilityForm({ locale }: { locale: OnboardingLocale }) {
  const t = onboardingCopy[locale];
  const e = t.eligibility;
  const [state, action, pending] = useActionState<EligibilityResult, FormData>(
    submitEligibility,
    null,
  );

  if (state && "ok" in state) {
    return (
      <div>
        <OnboardingSteps current={1} locale={locale} />
        <div className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <h2 className="text-xl font-bold">{e.recorded}</h2>
          {state.outcome === "pending" ? (
            <p className="mt-2 text-sm text-[#4a4a4a]">
              {e.pendingA}
              <strong>{e.pendingB}</strong>
              {e.pendingC}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#4a4a4a]">{e.canContinue}</p>
          )}
          <ForwardLink
            href="/professional/onboarding/assessment"
            className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
          >
            {e.toAssessment}
          </ForwardLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <OnboardingSteps current={1} locale={locale} />
      <form action={action} className="mt-8 space-y-8">
        <fieldset>
          <legend className="text-base font-semibold">{e.employmentLegend}</legend>
          <div className="mt-3 space-y-2 text-sm">
            {employmentStatuses.map((s, i) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="employmentStatus" value={s} defaultChecked={i === 0} />
                {e.employment[s]}
              </label>
            ))}
          </div>
        </fieldset>

        {locale !== "pt-PT" && (
        <fieldset>
          <legend className="text-base font-semibold">{e.trainingLegend}</legend>
          <p className="mt-2 text-sm text-[#4a4a4a]">
            {e.trainingHelpA}
            <strong>{e.trainingHelpB}</strong>
            {e.trainingHelpC}
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {mandatoryTrainingItems.map((item) => (
              <label key={item.key} className="flex items-center gap-2">
                <input type="checkbox" name={`training_${item.key}`} className="accent-[#2e7d32]" />
                {e.training[item.key]}
              </label>
            ))}
          </div>
        </fieldset>
        )}

        {state && "error" in state && <p className="text-sm text-[#da1e28]">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
        >
          {pending ? t.saving : t.continue}
        </button>
      </form>
    </div>
  );
}
