/**
 * The risk and needs questionnaire a private client (or a family member or
 * social worker on their behalf) completes before a booking request is
 * published. Asked for by Ana on 14 October 2026.
 *
 * DRAFT FOR ANA'S SIGN-OFF: the questions, points and thresholds below are a
 * proposal. Change them here (and bump QUESTIONNAIRE_VERSION) — scoring,
 * the form and the admin review screen all read this one file.
 *
 * This is guidance for safety, not a medical diagnosis.
 */

export const QUESTIONNAIRE_VERSION = "2026-10-14-draft";

export type Lang = "en" | "pt";
export type Text = Record<Lang, string>;

/** What kind of professional the answers point to. */
export type RoleFamily =
  | "support"
  | "nurse_adult"
  | "nurse_child"
  | "nurse_mental_health"
  | "physio"
  | "childcare";

/** Answers that force admin review whatever the total score. */
export type EscalationCode =
  | "behaviour_risk"
  | "health_worsening"
  | "mental_health_crisis"
  | "unsafe_environment"
  | "no_agreement";

export type Option = {
  id: string;
  label: Text;
  points: number;
  /** "Not sure" answers: two or more make the case unclear. */
  unsure?: boolean;
  escalate?: EscalationCode;
};

export type Question = { id: string; label: Text; help?: Text; options: readonly Option[] };

export type Respondent = "self" | "family" | "social_worker" | "other";

export const RESPONDENT_OPTIONS: readonly { id: Respondent; label: Text }[] = [
  { id: "self", label: { en: "The person who needs support", pt: "A pessoa que precisa de apoio" } },
  { id: "family", label: { en: "A family member or friend", pt: "Um familiar ou amigo" } },
  { id: "social_worker", label: { en: "A social worker or care professional", pt: "Um assistente social ou profissional de saúde" } },
  { id: "other", label: { en: "Someone else", pt: "Outra pessoa" } },
];

/** Any "yes" stops the form and tells the person to call the emergency number. */
export const EMERGENCY_QUESTIONS: readonly { id: string; label: Text }[] = [
  {
    id: "e_breathing",
    label: {
      en: "Right now, does the person have difficulty breathing, chest pain, or signs of a stroke (face drooping, arm weakness, slurred speech)?",
      pt: "Neste momento, a pessoa tem dificuldade em respirar, dor no peito ou sinais de AVC (boca ao lado, falta de força num braço, dificuldade em falar)?",
    },
  },
  {
    id: "e_unresponsive",
    label: {
      en: "Right now, is the person unconscious, not responding, or having a seizure?",
      pt: "Neste momento, a pessoa está inconsciente, não responde ou está a ter uma convulsão?",
    },
  },
  {
    id: "e_injury",
    label: {
      en: "Right now, is there severe bleeding, a serious injury, or a suspected overdose or poisoning?",
      pt: "Neste momento, há uma hemorragia grave, uma lesão grave ou suspeita de sobredosagem ou intoxicação?",
    },
  },
  {
    id: "e_danger",
    label: {
      en: "Right now, is anyone in immediate danger — including someone who intends to harm themselves or another person?",
      pt: "Neste momento, alguém está em perigo imediato — incluindo alguém que tenciona fazer mal a si próprio ou a outra pessoa?",
    },
  },
];

const UNSURE: Option = { id: "unsure", label: { en: "Not sure", pt: "Não sei" }, points: 0, unsure: true };

export const QUESTIONS: readonly Question[] = [
  {
    id: "person",
    label: { en: "Who needs support?", pt: "Quem precisa de apoio?" },
    options: [
      { id: "adult", label: { en: "An adult (18–64)", pt: "Um adulto (18–64 anos)" }, points: 0 },
      { id: "older_adult", label: { en: "An older adult (65 or over)", pt: "Uma pessoa idosa (65 ou mais anos)" }, points: 1 },
      { id: "child", label: { en: "A child (under 18)", pt: "Uma criança (menos de 18 anos)" }, points: 0 },
    ],
  },
  {
    id: "support_type",
    label: { en: "What is the main support needed?", pt: "Qual é o principal apoio necessário?" },
    options: [
      { id: "companionship", label: { en: "Company and practical help at home", pt: "Companhia e ajuda prática em casa" }, points: 0 },
      { id: "personal_care", label: { en: "Personal care (washing, dressing, toileting, eating)", pt: "Cuidados pessoais (higiene, vestir, ir à casa de banho, alimentação)" }, points: 1 },
      { id: "clinical", label: { en: "Clinical care (wound care, injections, catheter, feeding tube, monitoring)", pt: "Cuidados clínicos (pensos, injeções, algália, sonda, monitorização)" }, points: 2 },
      { id: "rehab", label: { en: "Physiotherapy or rehabilitation", pt: "Fisioterapia ou reabilitação" }, points: 1 },
      { id: "childcare", label: { en: "Childcare", pt: "Cuidados infantis" }, points: 0 },
    ],
  },
  {
    id: "mobility",
    label: { en: "How does the person move around?", pt: "Como se desloca a pessoa?" },
    options: [
      { id: "independent", label: { en: "Independently", pt: "De forma autónoma" }, points: 0 },
      { id: "some_help", label: { en: "With some help or a walking aid", pt: "Com alguma ajuda ou auxiliar de marcha" }, points: 1 },
      { id: "full_help", label: { en: "Needs full help or a hoist", pt: "Precisa de ajuda total ou de elevador de transferência" }, points: 2 },
      { id: "bed_bound", label: { en: "Mostly in bed", pt: "Está acamada a maior parte do tempo" }, points: 3 },
      UNSURE,
    ],
  },
  {
    id: "medication",
    label: { en: "What help is needed with medication?", pt: "Que ajuda é necessária com a medicação?" },
    options: [
      { id: "none", label: { en: "None, or the person manages it", pt: "Nenhuma, ou a pessoa gere sozinha" }, points: 0 },
      { id: "reminders", label: { en: "Reminders only", pt: "Apenas lembretes" }, points: 1 },
      { id: "administer", label: { en: "Someone must give it (including injections)", pt: "Alguém tem de a administrar (incluindo injeções)" }, points: 2 },
      UNSURE,
    ],
  },
  {
    id: "cognition",
    label: { en: "Are there concerns about memory or understanding?", pt: "Há preocupações com a memória ou a compreensão?" },
    options: [
      { id: "none", label: { en: "No", pt: "Não" }, points: 0 },
      { id: "some", label: { en: "Some confusion or forgetfulness", pt: "Alguma confusão ou esquecimento" }, points: 1 },
      { id: "significant", label: { en: "Dementia or significant confusion", pt: "Demência ou confusão significativa" }, points: 2 },
      UNSURE,
    ],
  },
  {
    id: "behaviour",
    label: {
      en: "Does the person sometimes behave in ways that could put themselves or others at risk (for example aggression or wandering)?",
      pt: "A pessoa tem por vezes comportamentos que podem pôr em risco a própria ou outras pessoas (por exemplo, agressividade ou deambulação)?",
    },
    options: [
      { id: "no", label: { en: "No", pt: "Não" }, points: 0 },
      { id: "occasionally", label: { en: "Occasionally", pt: "Ocasionalmente" }, points: 2 },
      { id: "often", label: { en: "Often, or seriously", pt: "Frequentemente, ou de forma grave" }, points: 4, escalate: "behaviour_risk" },
      UNSURE,
    ],
  },
  {
    id: "recent_change",
    label: {
      en: "Has the person left hospital or had a change in health in the last 2 weeks?",
      pt: "A pessoa teve alta hospitalar ou uma alteração no estado de saúde nas últimas 2 semanas?",
    },
    options: [
      { id: "no", label: { en: "No", pt: "Não" }, points: 0 },
      { id: "stable", label: { en: "Yes, and they are now stable", pt: "Sim, e está agora estável" }, points: 1 },
      { id: "worsening", label: { en: "Yes, and they are still unwell or getting worse", pt: "Sim, e continua doente ou está a piorar" }, points: 3, escalate: "health_worsening" },
      UNSURE,
    ],
  },
  {
    id: "falls",
    label: { en: "Falls in the last 3 months", pt: "Quedas nos últimos 3 meses" },
    options: [
      { id: "none", label: { en: "None", pt: "Nenhuma" }, points: 0 },
      { id: "one", label: { en: "One", pt: "Uma" }, points: 1 },
      { id: "two_plus", label: { en: "Two or more", pt: "Duas ou mais" }, points: 2 },
      UNSURE,
    ],
  },
  {
    id: "mental_health",
    label: { en: "Are there mental health concerns?", pt: "Há preocupações de saúde mental?" },
    options: [
      { id: "none", label: { en: "No", pt: "Não" }, points: 0 },
      { id: "stable", label: { en: "A diagnosed condition that is stable", pt: "Uma condição diagnosticada e estável" }, points: 1 },
      {
        id: "crisis",
        label: {
          en: "A recent crisis, self-harm or thoughts of suicide (not right now)",
          pt: "Uma crise recente, autolesão ou pensamentos suicidas (não neste momento)",
        },
        points: 4,
        escalate: "mental_health_crisis",
      },
      UNSURE,
    ],
  },
  {
    id: "environment",
    label: {
      en: "Are there safety concerns in the home (for example violence, an unsafe building, dangerous animals)?",
      pt: "Há preocupações de segurança na casa (por exemplo, violência, edifício inseguro, animais perigosos)?",
    },
    options: [
      { id: "none", label: { en: "No", pt: "Não" }, points: 0 },
      { id: "some", label: { en: "Some concerns", pt: "Algumas preocupações" }, points: 1 },
      { id: "serious", label: { en: "Serious concerns", pt: "Preocupações graves" }, points: 3, escalate: "unsafe_environment" },
      UNSURE,
    ],
  },
  {
    id: "agreement",
    label: {
      en: "Does the person agree to this support (or has their legal representative agreed)?",
      pt: "A pessoa concorda com este apoio (ou o seu representante legal concordou)?",
    },
    options: [
      { id: "yes", label: { en: "Yes", pt: "Sim" }, points: 0 },
      { id: "unsure", label: { en: "Not sure, or only partly", pt: "Não sei, ou apenas em parte" }, points: 2, unsure: true },
      { id: "no", label: { en: "No", pt: "Não" }, points: 4, escalate: "no_agreement" },
    ],
  },
];

/** Total points at or above which a request is high risk; medium starts at MEDIUM_FROM. */
export const HIGH_FROM = 12;
export const MEDIUM_FROM = 6;
/** This many "Not sure" answers make a case unclear. */
export const UNCLEAR_FROM_UNSURE = 2;

/** Which booking roles belong to which family, by role code (UK and Portugal). */
export const ROLE_FAMILY_BY_CODE: Record<string, RoleFamily> = {
  pt_auxiliar_saude: "support",
  healthcare_assistant: "support",
  support_worker: "support",
  pt_enfermeiro_adulto: "nurse_adult",
  adult_nurse: "nurse_adult",
  registered_nurse: "nurse_adult",
  pt_enfermeiro_pediatrico: "nurse_child",
  paediatric_nurse: "nurse_child",
  pt_enfermeiro_saude_mental: "nurse_mental_health",
  mental_health_nurse: "nurse_mental_health",
  pt_fisioterapeuta: "physio",
  physiotherapist: "physio",
  pt_cuidador_infantil: "childcare",
  pt_babysitter: "childcare",
  pt_ama_autorizada: "childcare",
  nanny: "childcare",
  babysitter: "childcare",
  childminder: "childcare",
  mothers_helper: "childcare",
};

export const ROLE_FAMILY_LABEL: Record<RoleFamily, Text> = {
  support: { en: "Support worker / healthcare assistant", pt: "Auxiliar de saúde / ajudante" },
  nurse_adult: { en: "Nurse (adult)", pt: "Enfermeiro(a) (adultos)" },
  nurse_child: { en: "Children's nurse", pt: "Enfermeiro(a) pediátrico(a)" },
  nurse_mental_health: { en: "Mental health nurse", pt: "Enfermeiro(a) de saúde mental" },
  physio: { en: "Physiotherapist", pt: "Fisioterapeuta" },
  childcare: { en: "Childcare professional", pt: "Profissional de cuidados infantis" },
};

export const RISK_LEVEL_LABEL: Record<"low" | "medium" | "high" | "unclear", Text> = {
  low: { en: "Low", pt: "Baixo" },
  medium: { en: "Medium", pt: "Médio" },
  high: { en: "High", pt: "Elevado" },
  unclear: { en: "Unclear", pt: "Pouco claro" },
};

export const REVIEW_REASON_LABEL: Record<string, Text> = {
  high_risk: { en: "High risk score", pt: "Pontuação de risco elevada" },
  unclear: { en: "Several answers were \"Not sure\" or inconsistent", pt: "Várias respostas \"Não sei\" ou inconsistentes" },
  inconsistent: { en: "Childcare was chosen for an adult", pt: "Foram escolhidos cuidados infantis para um adulto" },
  role_differs: { en: "Booked role differs from the recommendation", pt: "A categoria reservada difere da recomendação" },
  behaviour_risk: { en: "Behaviour that may put people at risk", pt: "Comportamento que pode pôr pessoas em risco" },
  health_worsening: { en: "Health still unwell or getting worse", pt: "Estado de saúde ainda instável ou a piorar" },
  mental_health_crisis: { en: "Recent mental health crisis or self-harm", pt: "Crise recente de saúde mental ou autolesão" },
  unsafe_environment: { en: "Serious safety concerns in the home", pt: "Preocupações graves de segurança na casa" },
  no_agreement: { en: "The person does not agree to the support", pt: "A pessoa não concorda com o apoio" },
};
