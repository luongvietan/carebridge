"use client";
import { useEffect, useRef, useState } from "react";
import {
  EMERGENCY_QUESTIONS,
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  RESPONDENT_OPTIONS,
  ROLE_FAMILY_LABEL,
  type Lang,
  type Respondent,
} from "@/lib/risk-assessment/questionnaire";
import { scoreRisk, type RiskResult, type RiskSubmission } from "@/lib/risk-assessment/score";

const COPY = {
  en: {
    heading: "Risk and needs assessment",
    intro:
      "Before your request is published, please answer a few questions about the person who needs support. This helps us recommend the right professional and keep everyone safe. It is guidance, not a medical diagnosis.",
    respondent: "Who is completing this assessment?",
    emergencyHeading: "First, is this an emergency?",
    yes: "Yes",
    no: "No",
    needsHeading: "About the support needed",
    consent:
      "I consent to CareBridge Connect using this information, which may include health information, to arrange safe support. If I am answering for someone else, I have their permission or I am authorised to act for them.",
    continue: "Continue",
    seeResult: "See recommendation",
    unanswered: "Please answer every question.",
    needConsent: "Please confirm your consent to continue.",
    stopHeading: "Call the emergency services now",
    stopBody: (n: string) =>
      `Based on your answer, this may be an emergency. Do not use CareBridge Connect for emergencies. Call ${n} now.`,
    call: (n: string) => `Call ${n}`,
    stopBack: "I answered by mistake — go back",
    resultHeading: "Our recommendation",
    recommended: "Recommended professional",
    review:
      "Because of some of your answers, our team will review your request before it is published to professionals. We will e-mail you when it has been reviewed.",
    noReview: "Choose this type of professional on the next step and your request will be published straight away.",
    disclaimer: "This recommendation is guidance only and is not a medical diagnosis.",
    edit: "Change my answers",
    next: "Continue to booking details",
  },
  pt: {
    heading: "Avaliação de riscos e necessidades",
    intro:
      "Antes de o seu pedido ser publicado, responda a algumas perguntas sobre a pessoa que precisa de apoio. Isto ajuda-nos a recomendar o profissional adequado e a manter todos em segurança. Trata-se de orientação e não de um diagnóstico médico.",
    respondent: "Quem está a preencher esta avaliação?",
    emergencyHeading: "Primeiro, trata-se de uma emergência?",
    yes: "Sim",
    no: "Não",
    needsHeading: "Sobre o apoio necessário",
    consent:
      "Autorizo a CareBridge Connect a utilizar esta informação, que pode incluir dados de saúde, para organizar um apoio seguro. Se respondo por outra pessoa, tenho a sua autorização ou estou autorizado(a) a agir em seu nome.",
    continue: "Continuar",
    seeResult: "Ver recomendação",
    unanswered: "Responda a todas as perguntas.",
    needConsent: "Confirme o seu consentimento para continuar.",
    stopHeading: "Ligue já para os serviços de emergência",
    stopBody: (n: string) =>
      `Com base na sua resposta, esta pode ser uma emergência. Não utilize a CareBridge Connect em emergências. Ligue já ${n}.`,
    call: (n: string) => `Ligar ${n}`,
    stopBack: "Respondi por engano — voltar",
    resultHeading: "A nossa recomendação",
    recommended: "Profissional recomendado",
    review:
      "Devido a algumas das suas respostas, a nossa equipa vai analisar o seu pedido antes de o publicar aos profissionais. Enviaremos um e-mail quando a análise estiver concluída.",
    noReview: "Escolha este tipo de profissional no passo seguinte e o seu pedido será publicado de imediato.",
    disclaimer: "Esta recomendação é apenas orientação e não constitui um diagnóstico médico.",
    edit: "Alterar respostas",
    next: "Continuar para os dados da marcação",
  },
} as const;

type Step = "questions" | "stop" | "result";

function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: readonly { id: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-brand-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-strong/30 ${
              value === o.id ? "border-brand-strong bg-brand-strong/10 font-medium text-brand-ink" : "border-line bg-white text-ink hover:border-brand-strong"
            }`}
          >
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The private client's risk and needs assessment. Emergency answers stop here
 * and nothing is sent; otherwise the parent receives the submission (the server
 * scores it again) and the preview result to recommend a role.
 */
export function RiskAssessmentForm({
  lang,
  emergencyNumber,
  initial,
  onComplete,
}: {
  lang: Lang;
  emergencyNumber: string;
  initial?: RiskSubmission | null;
  onComplete: (submission: RiskSubmission, result: RiskResult) => void;
}) {
  const c = COPY[lang];
  const [step, setStep] = useState<Step>("questions");
  const [respondent, setRespondent] = useState<Respondent | undefined>(initial?.respondent);
  const [emergency, setEmergency] = useState<Record<string, boolean>>(initial?.emergency ?? {});
  const [answers, setAnswers] = useState<Record<string, string>>(initial?.answers ?? {});
  const [consent, setConsent] = useState(initial?.consent ?? false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (step !== "questions") heading.current?.focus();
  }, [step]);

  function answerEmergency(id: string, yes: boolean) {
    setEmergency((e) => ({ ...e, [id]: yes }));
    if (yes) setStep("stop");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const complete =
      respondent &&
      EMERGENCY_QUESTIONS.every((q) => typeof emergency[q.id] === "boolean") &&
      QUESTIONS.every((q) => answers[q.id]);
    if (!complete) return setError(c.unanswered);
    if (!consent) return setError(c.needConsent);
    setResult(scoreRisk(answers));
    setStep("result");
  }

  if (step === "stop") {
    return (
      <section role="alert" aria-labelledby="risk-stop" className="space-y-4 rounded-2xl border-2 border-danger bg-[#fdecec] p-6">
        <h2 id="risk-stop" ref={heading} tabIndex={-1} className="text-2xl font-bold text-danger">{c.stopHeading}</h2>
        <p className="text-brand-ink">{c.stopBody(emergencyNumber)}</p>
        <a href={`tel:${emergencyNumber}`} className="inline-block rounded-full bg-danger px-6 py-3 text-lg font-bold text-white">
          {c.call(emergencyNumber)}
        </a>
        <p>
          <button
            type="button"
            className="text-sm font-semibold underline"
            onClick={() => {
              setEmergency((e) => Object.fromEntries(Object.entries(e).filter(([, v]) => v === false)));
              setStep("questions");
            }}
          >
            {c.stopBack}
          </button>
        </p>
      </section>
    );
  }

  if (step === "result" && result && respondent) {
    const needsReview = result.level === "high" || result.level === "unclear";
    return (
      <section aria-labelledby="risk-result" className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 id="risk-result" ref={heading} tabIndex={-1} className="text-xl font-semibold text-heading">{c.resultHeading}</h2>
        <p>
          <span className="block text-sm text-muted">{c.recommended}</span>
          <span className="text-lg font-semibold text-brand-ink">{ROLE_FAMILY_LABEL[result.recommendedFamily][lang]}</span>
        </p>
        <p className="text-sm text-ink">{needsReview ? c.review : c.noReview}</p>
        <p className="text-xs text-muted">{c.disclaimer}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onComplete({ version: QUESTIONNAIRE_VERSION, respondent, emergency, answers, consent }, result)}
            className="rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover"
          >
            {c.next}
          </button>
          <button type="button" onClick={() => setStep("questions")} className="text-sm font-semibold underline">
            {c.edit}
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} aria-describedby={error ? "risk-error" : undefined} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-heading">{c.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">{c.intro}</p>
      </div>
      <RadioGroup
        name="respondent"
        legend={c.respondent}
        options={RESPONDENT_OPTIONS.map((r) => ({ id: r.id, label: r.label[lang] }))}
        value={respondent}
        onChange={(v) => setRespondent(v as Respondent)}
      />
      <section className="space-y-4 rounded-2xl border border-line p-4">
        <h3 className="font-semibold text-brand-ink">{c.emergencyHeading}</h3>
        {EMERGENCY_QUESTIONS.map((q) => (
          <RadioGroup
            key={q.id}
            name={q.id}
            legend={q.label[lang]}
            options={[
              { id: "yes", label: c.yes },
              { id: "no", label: c.no },
            ]}
            value={emergency[q.id] === undefined ? undefined : emergency[q.id] ? "yes" : "no"}
            onChange={(v) => answerEmergency(q.id, v === "yes")}
          />
        ))}
      </section>
      <section className="space-y-5">
        <h3 className="font-semibold text-brand-ink">{c.needsHeading}</h3>
        {QUESTIONS.map((q) => (
          <RadioGroup
            key={q.id}
            name={q.id}
            legend={q.label[lang]}
            options={q.options.map((o) => ({ id: o.id, label: o.label[lang] }))}
            value={answers[q.id]}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
          />
        ))}
      </section>
      <label className="flex items-start gap-3 text-sm text-ink">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#2e7d32]" />
        <span>{c.consent}</span>
      </label>
      {error && <p id="risk-error" role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" className="rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover">
        {c.seeResult}
      </button>
    </form>
  );
}
