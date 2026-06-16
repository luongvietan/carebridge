"use client";
import { useActionState } from "react";
import Link from "next/link";
import { submitEligibility, type EligibilityResult } from "@/lib/onboarding/actions";
import { employmentStatuses, employmentStatusLabels } from "@/lib/validation/onboarding";
import { OnboardingSteps } from "@/components/onboarding-steps";

const MANDATORY_TRAINING = [
  "Safeguarding Adults",
  "Safeguarding Children",
  "Basic Life Support",
  "Infection Prevention & Control",
  "Health & Safety",
  "Moving & Handling",
  "GDPR & Confidentiality",
];

export default function EligibilityPage() {
  const [state, action, pending] = useActionState<EligibilityResult, FormData>(
    submitEligibility,
    null,
  );

  if (state && "ok" in state) {
    return (
      <div>
        <OnboardingSteps current={1} />
        <div className="mt-8 rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
          <h2 className="text-xl font-bold">Eligibility recorded</h2>
          {state.outcome === "pending" ? (
            <p className="mt-2 text-sm text-[#5b6a62]">
              Your application can proceed, but it will stay <strong>pending</strong> until you
              provide up-to-date mandatory training certificates.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#5b6a62]">You can continue to the assessment.</p>
          )}
          <Link
            href="/professional/onboarding/assessment"
            className="mt-6 inline-block bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027]"
          >
            Continue to assessment →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <OnboardingSteps current={1} />
      <form action={action} className="mt-8 space-y-8">
        <fieldset>
          <legend className="text-base font-semibold">Employment status</legend>
          <div className="mt-3 space-y-2 text-sm">
            {employmentStatuses.map((s, i) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="employmentStatus" value={s} defaultChecked={i === 0} />
                {employmentStatusLabels[s]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-base font-semibold">Mandatory training</legend>
          <p className="mt-2 text-sm text-[#5b6a62]">
            Confirm that all of the following were completed within the previous 12 months:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#5b6a62]">
            {MANDATORY_TRAINING.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="trainingCurrent" value="yes" defaultChecked /> Yes, all
              current
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="trainingCurrent" value="no" /> No, some need updating
            </label>
          </div>
        </fieldset>

        {state && "error" in state && <p className="text-sm text-[#da1e28]">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-[#198038] px-4 py-3 text-sm text-white hover:bg-[#0e6027] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
