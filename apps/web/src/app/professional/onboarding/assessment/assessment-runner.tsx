"use client";
import { Tr } from "@/components/portal-locale";
import { useReducer, useRef } from "react";
import { ForwardLink } from "@/components/forward-link";
import {
  startAttempt,
  submitAttempt,
  type AssessmentQuestion,
} from "@/lib/assessment/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { onboardingCopy, type OnboardingLocale } from "@/lib/onboarding/copy";

const TOPIC_LABEL: Record<string, string> = {
  safeguarding: "Safeguarding",
  infection_prevention_control: "Infection prevention and control",
  gdpr_confidentiality: "GDPR and confidentiality",
  professional_boundaries: "Professional boundaries",
  documentation_record_keeping: "Documentation and record keeping",
  medication_awareness: "Medication awareness",
  health_safety: "Health and safety",
  role_specific: "Role-specific practice",
};

type Phase = "intro" | "questions" | "result" | "locked";

type State = {
  phase: Phase;
  /** The role this attempt is for — a professional may hold several. */
  roleName: string | null;
  questions: AssessmentQuestion[];
  answers: Record<string, string>;
  result: { score: number; passed: boolean; canRetry: boolean } | null;
  error: string | null;
  busy: boolean;
};

type Action =
  | { type: "busy" }
  | { type: "clear-error" }
  | { type: "error"; error: string }
  | { type: "locked" }
  | { type: "start"; questions: AssessmentQuestion[]; roleName: string | null }
  | { type: "answer"; questionId: string; key: string }
  | { type: "result"; result: { score: number; passed: boolean; canRetry: boolean } }
  | { type: "reset-intro" };

const initialState: State = {
  phase: "intro",
  roleName: null,
  questions: [],
  answers: {},
  result: null,
  error: null,
  busy: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "busy":
      return { ...state, busy: true, error: null };
    case "clear-error":
      return { ...state, busy: false };
    case "error":
      return { ...state, busy: false, error: action.error };
    case "locked":
      return { ...state, phase: "locked", busy: false, error: null };
    case "start":
      return {
        ...state,
        phase: "questions",
        roleName: action.roleName,
        questions: action.questions,
        answers: {},
        busy: false,
        error: null,
      };
    case "answer":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.key },
      };
    case "result":
      return { ...state, phase: "result", result: action.result, busy: false, error: null };
    case "reset-intro":
      return { ...state, phase: "intro", result: null, error: null };
    default:
      return state;
  }
}

export function AssessmentRunner({
  roleId,
  locale = "en-GB",
}: {
  roleId?: string;
  locale?: OnboardingLocale;
}) {
  const a = onboardingCopy[locale].assessment;
  const [state, dispatch] = useReducer(reducer, initialState);
  const attemptIdRef = useRef("");

  async function begin() {
    dispatch({ type: "busy" });
    const r = await startAttempt(roleId);
    if ("error" in r) return dispatch({ type: "error", error: r.error });
    if ("locked" in r) return dispatch({ type: "locked" });
    attemptIdRef.current = r.attemptId;
    dispatch({ type: "start", questions: r.questions, roleName: r.roleName });
  }

  async function submit() {
    dispatch({ type: "busy" });
    const r = await submitAttempt(attemptIdRef.current, state.answers);
    if ("error" in r) return dispatch({ type: "error", error: r.error });
    dispatch({ type: "result", result: { score: r.score, passed: r.passed, canRetry: r.canRetry } });
  }

  const allAnswered =
    state.questions.length > 0 && state.questions.every((q) => state.answers[q.id]);

  return (
    <div>
      <OnboardingSteps current={2} locale={locale} />
      <div className="mt-8">
        {state.error && <p className="mb-4 text-sm text-[#da1e28]"><Tr>{state.error}</Tr></p>}

        {state.phase === "intro" && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">{a.title}</h2>
            <p className="mt-2 text-sm text-[#4a4a4a]">
              {a.note}
            </p>
            <button
              type="button"
              onClick={begin}
              disabled={state.busy}
              className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
            >
              {state.busy ? a.loading : a.begin}
            </button>
          </div>
        )}

        {state.phase === "questions" && state.roleName && (
          <p className="mb-4 text-sm text-[#4a4a4a]">
            {a.forRoleA}
            <strong>{state.roleName}</strong>
            {a.forRoleB}
          </p>
        )}

        {state.phase === "questions" && (
          <div className="space-y-6">
            {state.questions.map((q, i) => (
              <fieldset key={q.id} className="rounded-2xl border border-[#dbe7e0] bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
                <legend className="px-1 text-xs tracking-wide text-[#4a4a4a] uppercase">
                  <Tr>{TOPIC_LABEL[q.topic] ?? q.topic.replace(/_/g, " ")}</Tr>
                </legend>
                <p className="font-semibold">
                  {i + 1}. {q.question_text}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  {q.options.map((o) => (
                    <label key={o.key} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={q.id}
                        value={o.key}
                        checked={state.answers[q.id] === o.key}
                        onChange={() => dispatch({ type: "answer", questionId: q.id, key: o.key })}
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              onClick={submit}
              disabled={state.busy || !allAnswered}
              className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
            >
              {state.busy ? a.submitting : a.submit}
            </button>
            {!allAnswered && <p className="text-sm text-[#7a8a81]">{a.answerAll}</p>}
          </div>
        )}

        {state.phase === "result" && state.result && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">
              {a.score} <span className="tabular-nums">{state.result.score}%</span>
            </h2>
            {state.result.passed ? (
              <>
                <p className="mt-2 text-sm text-[#2e7d32]">{a.passed}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ForwardLink
                    href="/professional/onboarding/profile"
                    className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
                  >
                    {a.toProfile}
                  </ForwardLink>
                  <ForwardLink
                    href="/professional/onboarding/assessment/certificate"
                    className="rounded-full border border-[#2e7d32] px-4 py-3 text-sm text-[#2e7d32] hover:bg-[#eef5f0]"
                  >
                    {a.certificate}
                  </ForwardLink>
                </div>
              </>
            ) : state.result.canRetry ? (
              <>
                <p className="mt-2 text-sm text-[#da1e28]">{a.below}</p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "reset-intro" })}
                  className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
                >
                  {a.tryAgain}
                </button>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#da1e28]">
                {a.usedAll}
              </p>
            )}
          </div>
        )}

        {state.phase === "locked" && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">{a.lockedTitle}</h2>
            <p className="mt-2 text-sm text-[#4a4a4a]">
              {a.lockedBody}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

