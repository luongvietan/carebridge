"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLIENT_RESULT,
  EMERGENCY_QUESTIONS,
  EMERGENCY_RESULT,
  LIMITATION,
  QUESTIONNAIRE_VERSION,
  RESPONDENT_OPTIONS,
  RESPONDENT_QUESTION,
  ROLE_FAMILY_LABEL,
  SAFETY_INTRO,
  SECTIONS,
  type Answers,
  type Lang,
  type Respondent,
} from "@/lib/risk-assessment/questionnaire";
import {
  assessRisk,
  clientResultKey,
  visibleAnswers,
  visibleQuestions,
  withRespondent,
  type RiskResult,
  type RiskSubmission,
} from "@/lib/risk-assessment/score";

const COPY = {
  en: {
    heading: "Risk and needs assessment",
    intro:
      "Before your request is published, please answer some questions about the person who needs support. This helps us route the request safely to the right professional. You will only see the questions that apply.",
    privacyHeading: "Before you share health information",
    privacy: [
      "CareBridge Connect, Unipessoal Lda uses your answers only to route this request safely and to arrange the service.",
      "Legal basis: your explicit consent to the processing of health information (Article 9(2)(a) GDPR) and the steps needed to arrange the service you request.",
      "Who sees it: authorised CareBridge staff see the full assessment. The matched professional sees only the information needed to accept and deliver the service safely.",
      "Retention: kept with the booking for as long as needed for the service and our legal obligations, as set out in the Privacy Policy.",
      "Your rights: access, correction, erasure, restriction, objection, withdrawal of consent and complaint to the CNPD. Contact privacy@carebridgeconnects.com.",
    ],
    privacyLink: "Read the Privacy Policy",
    consent:
      "I have read this notice and consent to CareBridge Connect using this information, including health information, for this purpose.",
    continue: "Continue",
    emergencyHeading: "Immediate safety",
    yes: "Yes",
    no: "No",
    seeResult: "See recommendation",
    unanswered: "Please answer every question.",
    needRespondent: "Please say who is completing the assessment.",
    needConsent: "Please read the notice and give your consent to continue.",
    stopHeading: "Call 112 now",
    call: (n: string) => `Call ${n}`,
    understood: "I understand",
    resultHeading: "Our recommendation",
    recommended: "Recommended professional",
    edit: "Change my answers",
    next: "Continue to booking details",
  },
  pt: {
    heading: "Avaliação de riscos e necessidades",
    intro:
      "Antes de o seu pedido ser publicado, responda a algumas perguntas sobre a pessoa que precisa de apoio. Isto ajuda-nos a encaminhar o pedido em segurança para o profissional adequado. Só verá as perguntas que se aplicam.",
    privacyHeading: "Antes de partilhar dados de saúde",
    privacy: [
      "A CareBridge Connect, Unipessoal Lda utiliza as suas respostas apenas para encaminhar este pedido em segurança e organizar o serviço.",
      "Fundamento jurídico: o seu consentimento explícito para o tratamento de dados de saúde (artigo 9.º, n.º 2, alínea a), do RGPD) e as diligências necessárias para organizar o serviço que solicita.",
      "Quem tem acesso: o pessoal autorizado da CareBridge vê a avaliação completa. O profissional selecionado vê apenas a informação necessária para aceitar e prestar o serviço em segurança.",
      "Conservação: guardada com a marcação durante o tempo necessário ao serviço e às nossas obrigações legais, conforme a Política de Privacidade.",
      "Os seus direitos: acesso, retificação, apagamento, limitação, oposição, retirada do consentimento e reclamação junto da CNPD. Contacto: privacy@carebridgeconnects.com.",
    ],
    privacyLink: "Ler a Política de Privacidade",
    consent:
      "Li este aviso e autorizo a CareBridge Connect a utilizar esta informação, incluindo dados de saúde, para esta finalidade.",
    continue: "Continuar",
    emergencyHeading: "Segurança imediata",
    yes: "Sim",
    no: "Não",
    seeResult: "Ver recomendação",
    unanswered: "Responda a todas as perguntas.",
    needRespondent: "Indique quem está a preencher a avaliação.",
    needConsent: "Leia o aviso e dê o seu consentimento para continuar.",
    stopHeading: "Ligue já 112",
    call: (n: string) => `Ligar ${n}`,
    understood: "Compreendo",
    resultHeading: "A nossa recomendação",
    recommended: "Profissional recomendado",
    edit: "Alterar respostas",
    next: "Continuar para os dados da marcação",
  },
} as const;

type Step = "start" | "emergency" | "questions" | "stop" | "result";

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
 * Ana's Private Client Risk and Needs Assessment (v1.0). Order follows her
 * workflow: who is answering and the privacy notice and consent, then the
 * emergency screen (any "Yes" stops everything), then only the questions that
 * apply. The server re-scores the submission; this preview only drives the UI.
 */
export function RiskAssessmentForm({
  lang,
  emergencyNumber,
  initial,
  onComplete,
  exitHref = "/client/bookings",
}: {
  lang: Lang;
  emergencyNumber: string;
  initial?: RiskSubmission | null;
  onComplete: (submission: RiskSubmission, result: RiskResult) => void;
  exitHref?: string;
}) {
  const c = COPY[lang];
  const [step, setStep] = useState<Step>(initial ? "questions" : "start");
  const [respondent, setRespondent] = useState<Respondent | undefined>(initial?.respondent);
  const [consent, setConsent] = useState(initial?.consent ?? false);
  const [emergency, setEmergency] = useState<Record<string, boolean>>(initial?.emergency ?? {});
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? {});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  // Move focus to the new step's heading — but not on first load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const shown = useMemo(() => visibleQuestions(withRespondent(respondent, answers)), [respondent, answers]);

  function next(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === "start") {
      if (!respondent) return setError(c.needRespondent);
      if (!consent) return setError(c.needConsent);
      return setStep("emergency");
    }
    if (step === "emergency") {
      if (!EMERGENCY_QUESTIONS.every((q) => emergency[q.id] === false)) return setError(c.unanswered);
      return setStep("questions");
    }
    if (step === "questions" && respondent) {
      if (!shown.every((q) => answers[q.id])) return setError(c.unanswered);
      setResult(assessRisk(respondent, visibleAnswers(respondent, answers)));
      setStep("result");
    }
  }

  if (step === "stop") {
    return (
      <section role="alert" aria-labelledby="risk-stop" className="space-y-4 rounded-2xl border-2 border-danger bg-[#fdecec] p-6">
        <h2 id="risk-stop" ref={heading} tabIndex={-1} className="text-2xl font-bold text-danger">{c.stopHeading}</h2>
        <p className="text-brand-ink">{EMERGENCY_RESULT[lang]}</p>
        <a href={`tel:${emergencyNumber}`} className="inline-block rounded-full bg-danger px-6 py-3 text-lg font-bold text-white">
          {c.call(emergencyNumber)}
        </a>
        <p>
          <Link href={exitHref} className="font-semibold underline">{c.understood}</Link>
        </p>
      </section>
    );
  }

  if (step === "result" && result && respondent) {
    return (
      <section aria-labelledby="risk-result" className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h2 id="risk-result" ref={heading} tabIndex={-1} className="text-xl font-semibold text-heading">{c.resultHeading}</h2>
        <p>
          <span className="block text-sm text-muted">{c.recommended}</span>
          <span className="text-lg font-semibold text-brand-ink">{ROLE_FAMILY_LABEL[result.recommendedFamily][lang]}</span>
        </p>
        <p className="text-sm text-ink">{CLIENT_RESULT[clientResultKey(result)][lang]}</p>
        <p className="text-xs text-muted">{LIMITATION[lang]}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              onComplete(
                { version: QUESTIONNAIRE_VERSION, respondent, emergency, answers: visibleAnswers(respondent, answers), consent },
                result,
              )
            }
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
    <form onSubmit={next} aria-describedby={error ? "risk-error" : undefined} className="space-y-6">
      <div>
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold text-heading">{c.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">{c.intro}</p>
        <p className="mt-2 text-xs text-muted">{LIMITATION[lang]}</p>
      </div>

      {step === "start" && (
        <>
          <RadioGroup
            name="A1"
            legend={RESPONDENT_QUESTION[lang]}
            options={RESPONDENT_OPTIONS.map((r) => ({ id: r.id, label: r.label[lang] }))}
            value={respondent}
            onChange={(v) => setRespondent(v as Respondent)}
          />
          <section aria-labelledby="risk-privacy" className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm">
            <h3 id="risk-privacy" className="font-semibold text-brand-ink">{c.privacyHeading}</h3>
            {c.privacy.map((line) => <p key={line} className="leading-relaxed text-ink">{line}</p>)}
            <p><Link href="/privacy" target="_blank" className="font-semibold text-brand-strong underline">{c.privacyLink}</Link></p>
          </section>
          <label className="flex items-start gap-3 text-sm text-ink">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#2e7d32]" />
            <span>{c.consent}</span>
          </label>
        </>
      )}

      {step === "emergency" && (
        <section className="space-y-4 rounded-2xl border border-danger/40 p-4">
          <h3 className="font-semibold text-brand-ink">{c.emergencyHeading}</h3>
          <p className="text-sm font-medium text-danger">{SAFETY_INTRO[lang]}</p>
          {EMERGENCY_QUESTIONS.map((q) => (
            <RadioGroup
              key={q.id}
              name={q.id}
              legend={q.label[lang]}
              options={[
                { id: "no", label: c.no },
                { id: "yes", label: c.yes },
              ]}
              value={emergency[q.id] === undefined ? undefined : emergency[q.id] ? "yes" : "no"}
              onChange={(v) => {
                setEmergency((e) => ({ ...e, [q.id]: v === "yes" }));
                if (v === "yes") setStep("stop");
              }}
            />
          ))}
        </section>
      )}

      {step === "questions" &&
        SECTIONS.map((section) => {
          const qs = shown.filter((q) => q.section === section.id);
          if (qs.length === 0) return null;
          return (
            <section key={section.id} className="space-y-5 rounded-2xl border border-line p-4">
              <div>
                <h3 className="font-semibold text-brand-ink">{section.title[lang]}</h3>
                {section.intro && <p className="mt-1 text-xs text-muted">{section.intro[lang]}</p>}
              </div>
              {qs.map((q) => (
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
          );
        })}

      {error && <p id="risk-error" role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" className="rounded-full bg-brand-strong px-4 py-3 text-sm text-white hover:bg-brand-strong-hover">
        {step === "questions" ? c.seeResult : c.continue}
      </button>
    </form>
  );
}
