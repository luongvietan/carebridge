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
        <div className="mt-8 border border-[#e0e0e0] p-6">
          <h2 className="text-xl font-light">Eligibility recorded</h2>
          {state.outcome === "pending" ? (
            <p className="mt-2 text-sm text-[#525252]">
              Your application can proceed, but it will stay <strong>pending</strong> until you
              provide up-to-date mandatory training certificates.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#525252]">You can continue to the assessment.</p>
          )}
          <Link
            href="/professional/onboarding/assessment"
            className="mt-6 inline-block bg-[#0f62fe] px-4 py-3 text-sm text-white hover:bg-[#0050e6]"
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
          <p className="mt-2 text-sm text-[#525252]">
            Confirm that all of the following were completed within the previous 12 months:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[#525252]">
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
          className="bg-[#0f62fe] px-4 py-3 text-sm text-white hover:bg-[#0050e6] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
