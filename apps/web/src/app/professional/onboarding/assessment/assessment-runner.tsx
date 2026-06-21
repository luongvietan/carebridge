"use client";
import { useReducer, useRef } from "react";
import { ForwardLink } from "@/components/forward-link";
import {
  startAttempt,
  submitAttempt,
  type AssessmentQuestion,
} from "@/lib/assessment/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";

type Phase = "intro" | "questions" | "result" | "locked";

type State = {
  phase: Phase;
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
  | { type: "start"; questions: AssessmentQuestion[] }
  | { type: "answer"; questionId: string; key: string }
  | { type: "result"; result: { score: number; passed: boolean; canRetry: boolean } }
  | { type: "reset-intro" };

const initialState: State = {
  phase: "intro",
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

export function AssessmentRunner() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const attemptIdRef = useRef("");

  async function begin() {
    dispatch({ type: "busy" });
    const r = await startAttempt();
    if ("error" in r) return dispatch({ type: "error", error: r.error });
    if ("locked" in r) return dispatch({ type: "locked" });
    attemptIdRef.current = r.attemptId;
    dispatch({ type: "start", questions: r.questions });
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
      <OnboardingSteps current={2} />
      <div className="mt-8">
        {state.error && <p className="mb-4 text-sm text-[#da1e28]">{state.error}</p>}

        {state.phase === "intro" && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">Competency assessment</h2>
            <p className="mt-2 text-sm text-[#4a4a4a]">
              {QUESTIONS_NOTE}
            </p>
            <button
              type="button"
              onClick={begin}
              disabled={state.busy}
              className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627] disabled:opacity-50"
            >
              {state.busy ? "Loading…" : "Begin assessment"}
            </button>
          </div>
        )}

        {state.phase === "questions" && (
          <div className="space-y-6">
            {state.questions.map((q, i) => (
              <fieldset key={q.id} className="rounded-2xl border border-[#dbe7e0] bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
                <legend className="px-1 text-xs tracking-wide text-[#4a4a4a] uppercase">
                  {q.topic.replace(/_/g, " ")}
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
              {state.busy ? "Submitting…" : "Submit answers"}
            </button>
            {!allAnswered && <p className="text-sm text-[#7a8a81]">Answer every question to submit.</p>}
          </div>
        )}

        {state.phase === "result" && state.result && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">
              Score: <span className="tabular-nums">{state.result.score}%</span>
            </h2>
            {state.result.passed ? (
              <>
                <p className="mt-2 text-sm text-[#2e7d32]">Passed — the minimum is 80%.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ForwardLink
                    href="/professional/onboarding/profile"
                    className="rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
                  >
                    Continue to profile
                  </ForwardLink>
                  <ForwardLink
                    href="/professional/onboarding/assessment/certificate"
                    className="rounded-full border border-[#2e7d32] px-4 py-3 text-sm text-[#2e7d32] hover:bg-[#eef5f0]"
                  >
                    View your certificate
                  </ForwardLink>
                </div>
              </>
            ) : state.result.canRetry ? (
              <>
                <p className="mt-2 text-sm text-[#da1e28]">Below the 80% pass mark. You may try again.</p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "reset-intro" })}
                  className="mt-6 rounded-full bg-[#2e7d32] px-4 py-3 text-sm text-white hover:bg-[#246627]"
                >
                  Try again
                </button>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#da1e28]">
                You have used all three attempts. You may reapply after the lock period.
              </p>
            )}
          </div>
        )}

        {state.phase === "locked" && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">Assessment locked</h2>
            <p className="mt-2 text-sm text-[#4a4a4a]">
              You have used all attempts for now. Please reapply after the lock period has passed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const QUESTIONS_NOTE =
  "You will be asked 20 questions — 15 covering core healthcare topics and 5 specific to your professional role — drawn at random and auto-scored. You need 80% to pass and have up to three attempts. Topics include safeguarding, infection prevention & control, GDPR, professional boundaries, documentation, medication awareness and health & safety.";
