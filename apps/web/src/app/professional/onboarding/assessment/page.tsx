"use client";
import { useState } from "react";
import { ForwardLink } from "@/components/forward-link";
import {
  startAttempt,
  submitAttempt,
  type AssessmentQuestion,
} from "@/lib/assessment/actions";
import { OnboardingSteps } from "@/components/onboarding-steps";

type Phase = "intro" | "questions" | "result" | "locked";

export default function AssessmentPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; canRetry: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    setError(null);
    const r = await startAttempt();
    setBusy(false);
    if ("error" in r) return setError(r.error);
    if ("locked" in r) return setPhase("locked");
    setQuestions(r.questions);
    setAttemptId(r.attemptId);
    setAnswers({});
    setPhase("questions");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await submitAttempt(attemptId, answers);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    setResult({ score: r.score, passed: r.passed, canRetry: r.canRetry });
    setPhase("result");
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  return (
    <div>
      <OnboardingSteps current={2} />
      <div className="mt-8">
        {error && <p className="mb-4 text-sm text-[#da1e28]">{error}</p>}

        {phase === "intro" && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">Competency assessment</h2>
            <p className="mt-2 text-sm text-[#5b6a62]">
              {QUESTIONS_NOTE}
            </p>
            <button
              onClick={begin}
              disabled={busy}
              className="mt-6 rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
            >
              {busy ? "Loading…" : "Begin assessment"}
            </button>
          </div>
        )}

        {phase === "questions" && (
          <div className="space-y-6">
            {questions.map((q, i) => (
              <fieldset key={q.id} className="rounded-2xl border border-[#dbe7e0] bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
                <legend className="px-1 text-xs tracking-wide text-[#5b6a62] uppercase">
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
                        checked={answers[q.id] === o.key}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))}
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              onClick={submit}
              disabled={busy || !allAnswered}
              className="rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42] disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Submit answers"}
            </button>
            {!allAnswered && <p className="text-sm text-[#7a8a81]">Answer every question to submit.</p>}
          </div>
        )}

        {phase === "result" && result && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">
              Score: <span className="tabular-nums">{result.score}%</span>
            </h2>
            {result.passed ? (
              <>
                <p className="mt-2 text-sm text-[#24a148]">Passed — the minimum is 80%.</p>
                <ForwardLink
                  href="/professional/onboarding/profile"
                  className="mt-6 rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42]"
                >
                  Continue to profile
                </ForwardLink>
              </>
            ) : result.canRetry ? (
              <>
                <p className="mt-2 text-sm text-[#da1e28]">Below the 80% pass mark. You may try again.</p>
                <button
                  onClick={() => setPhase("intro")}
                  className="mt-6 rounded-full bg-[#0c6e4f] px-4 py-3 text-sm text-white hover:bg-[#0a5c42]"
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

        {phase === "locked" && (
          <div className="rounded-2xl border border-[#dbe7e0] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,38,28,0.10)]">
            <h2 className="text-xl font-bold">Assessment locked</h2>
            <p className="mt-2 text-sm text-[#5b6a62]">
              You have used all attempts for now. Please reapply after the lock period has passed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const QUESTIONS_NOTE =
  "Questions are drawn at random and auto-scored. You need 80% to pass and have up to three attempts. Topics include safeguarding, infection control, GDPR, professional boundaries, documentation, medication awareness and health & safety.";
