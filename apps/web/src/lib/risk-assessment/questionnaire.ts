/**
 * CareBridge Private Client Risk and Needs Assessment — Version 1.0, Portugal
 * live pilot (Ana, 14 October 2026; "CareBridge_Private_Client_Risk_and_Needs_
 * Assessment_Bilingual.pdf"). The question wording is Ana's, in English and
 * European Portuguese.
 *
 * Questions are conditional: `showIf` hides what does not apply (the child
 * branch only for children, clinical follow-ups only when relevant), and the
 * server applies the same visibility, so a hidden question is never required.
 *
 * Each option may carry points (section 12 of the spec) and a flag (sections 2
 * and 13). The rules in score.ts turn flags and points into the routing
 * outcome. Change wording, points or flags here and bump QUESTIONNAIRE_VERSION:
 * stored assessments keep the version they were scored with.
 *
 * A screening and routing tool — not a diagnosis or a validated clinical scale.
 */

export const QUESTIONNAIRE_VERSION = "2026-10-15-v1.0";

/**
 * Clinical review of the questions and override rules for the pilot, recorded
 * in Ana's words (15 October 2026). A further review by a nurse registered
 * with the Ordem dos Enfermeiros is being arranged separately by Ana.
 */
export const CLINICAL_REVIEW = {
  version: QUESTIONNAIRE_VERSION,
  statement: "Reviewed by Ana Dos Santos, UK Registered Nurse and Founder of CareBridge Connect.",
  date: "2026-10-15",
  pending: "Additional review by a nurse registered with the Portuguese Ordem dos Enfermeiros — arranged by Ana.",
} as const;

export type Lang = "en" | "pt";
export type Text = Record<Lang, string>;
export type Answers = Record<string, string>;

/** What kind of professional the answers point to. */
export type RoleFamily =
  | "support"
  | "nurse_adult"
  | "nurse_child"
  | "nurse_mental_health"
  | "physio"
  | "childcare";

/**
 * Flags raised by answers. `amber` and `red` hold the request for review;
 * `nursing` also restricts it to nurses; `scope` means it must not be
 * published until the risk is controlled, or it is declined.
 */
export type FlagLevel = "amber" | "red" | "nursing" | "scope";

export type Option = {
  id: string;
  label: Text;
  points?: number;
  flag?: string;
  /** "Not sure" style answers. Important ones carry a flag of their own. */
  unsure?: boolean;
};

export type SectionId = "about" | "service" | "daily" | "mobility" | "clinical" | "wellbeing" | "risks" | "child";

export type Question = {
  id: string;
  section: SectionId;
  label: Text;
  options: readonly Option[];
  showIf?: (a: Answers) => boolean;
};

export type Respondent = "self" | "family" | "legal_representative" | "professional" | "other";

const YES: Text = { en: "Yes", pt: "Sim" };
const NO: Text = { en: "No", pt: "Não" };
const NOT_SURE: Text = { en: "Not sure", pt: "Não tenho a certeza" };

export const SAFETY_INTRO: Text = {
  en: "CareBridge is not an emergency service. If the person is in immediate danger or has a serious or life-threatening problem, call 112 now.",
  pt: "A CareBridge não é um serviço de emergência. Se a pessoa estiver em perigo imediato ou apresentar uma situação grave ou com risco de vida, ligue agora para o 112.",
};

export const LIMITATION: Text = {
  en: "This is a CareBridge screening and routing tool. It is not a diagnosis, clinical assessment, emergency service or validated medical scoring instrument.",
  pt: "Esta é uma ferramenta CareBridge de triagem e encaminhamento. Não constitui diagnóstico, avaliação clínica, serviço de emergência ou escala médica validada.",
};

export const RESPONDENT_QUESTION: Text = { en: "Who is completing this assessment?", pt: "Quem está a preencher esta avaliação?" };

export const RESPONDENT_OPTIONS: readonly { id: Respondent; label: Text }[] = [
  { id: "self", label: { en: "The person receiving support", pt: "A pessoa que receberá o apoio" } },
  { id: "family", label: { en: "Family member or informal carer", pt: "Familiar ou cuidador informal" } },
  { id: "legal_representative", label: { en: "Legal representative", pt: "Representante legal" } },
  { id: "professional", label: { en: "Social worker or healthcare professional", pt: "Assistente social ou profissional de saúde" } },
  { id: "other", label: { en: "Other", pt: "Outro" } },
];

/** Any "Yes" is outcome E: stop, save nothing, show the 112 guidance. */
export const EMERGENCY_QUESTIONS: readonly { id: string; label: Text }[] = [
  {
    id: "E1",
    label: {
      en: "Is the person unconscious, unresponsive or not breathing normally?",
      pt: "A pessoa está inconsciente, não responde ou não respira normalmente?",
    },
  },
  {
    id: "E2",
    label: {
      en: "Does the person have severe difficulty breathing, blue lips, sudden severe chest pain or signs of a possible stroke?",
      pt: "A pessoa apresenta dificuldade respiratória grave, lábios azulados, dor súbita e intensa no peito ou sinais de possível AVC?",
    },
  },
  {
    id: "E3",
    label: {
      en: "Is there uncontrolled heavy bleeding, a severe injury, a serious burn, choking or an ongoing seizure?",
      pt: "Existe hemorragia intensa não controlada, lesão grave, queimadura grave, engasgamento ou convulsão em curso?",
    },
  },
  {
    id: "E4",
    label: {
      en: "Is there an immediate risk of suicide, serious self-harm, violence, abuse or danger to a child or vulnerable adult?",
      pt: "Existe risco imediato de suicídio, autoagressão grave, violência, abuso ou perigo para uma criança ou adulto vulnerável?",
    },
  },
  {
    id: "E5",
    label: {
      en: "Has a health professional told you that the current situation requires urgent emergency care?",
      pt: "Um profissional de saúde informou que a situação atual exige cuidados urgentes de emergência?",
    },
  },
];

export const SECTIONS: readonly { id: SectionId; title: Text; intro?: Text }[] = [
  { id: "about", title: { en: "About the person and authority", pt: "A pessoa e a legitimidade" } },
  { id: "service", title: { en: "Basic service information", pt: "Informação básica do serviço" } },
  {
    id: "daily",
    title: { en: "Daily living", pt: "Vida diária" },
    intro: {
      en: "Answer for the person's usual level of need, not their best day.",
      pt: "Considere a necessidade habitual e não o melhor dia.",
    },
  },
  { id: "mobility", title: { en: "Mobility, falls and environment", pt: "Mobilidade, quedas e ambiente" } },
  { id: "clinical", title: { en: "Clinical and nursing needs", pt: "Necessidades clínicas e de enfermagem" } },
  { id: "wellbeing", title: { en: "Cognition, behaviour, mental health and safeguarding", pt: "Cognição, comportamento, saúde mental e proteção" } },
  { id: "risks", title: { en: "Infection, allergy and lone working", pt: "Infeção, alergias e trabalho isolado" } },
  { id: "child", title: { en: "Children and childcare", pt: "Crianças e cuidados infantis" } },
];

const isChild = (a: Answers) => a.B1 === "child";
const isAdult = (a: Answers) => a.B1 === "adult";

/** D1–D8 share one 0–3 scale; 3 raises the manual-handling flag (score.ts). */
const DEPENDENCY: readonly Option[] = [
  { id: "0", label: { en: "Independent", pt: "Independente" }, points: 0 },
  { id: "1", label: { en: "Needs prompting or occasional help", pt: "Precisa de orientação ou ajuda ocasional" }, points: 1 },
  { id: "2", label: { en: "Needs regular hands-on help from one person", pt: "Precisa de ajuda física regular de uma pessoa" }, points: 2 },
  {
    id: "3",
    label: {
      en: "Needs two people, specialist equipment or continuous supervision",
      pt: "Precisa de duas pessoas, equipamento específico ou supervisão contínua",
    },
    points: 3,
  },
];

const daily = (id: string, en: string, pt: string): Question => ({
  id,
  section: "daily",
  label: { en, pt },
  options: DEPENDENCY,
  showIf: isAdult,
});

/** Clinical follow-ups (C2, C3) only when the request already points to clinical care. */
const clinicalContext = (a: Answers) =>
  isAdult(a) &&
  (["recovery", "nursing", "other"].includes(a.B2) ||
    (a.B4 !== undefined && a.B4 !== "no") ||
    a.C1 === "administer");

export const QUESTIONS: readonly Question[] = [
  // 4 — person completing the assessment
  {
    id: "A2",
    section: "about",
    label: {
      en: "Do you have authority to provide this information and request support for the person?",
      pt: "Tem autorização para fornecer estas informações e solicitar apoio para a pessoa?",
    },
    options: [
      { id: "yes", label: YES },
      { id: "no", label: NO, flag: "authority_unclear" },
      { id: "not_sure", label: NOT_SURE, unsure: true, flag: "authority_unclear" },
    ],
    showIf: (a) => a.A1 !== "self",
  },
  {
    id: "A3",
    section: "about",
    label: {
      en: "Can the person receiving support take part in decisions about their care?",
      pt: "A pessoa que receberá o apoio consegue participar nas decisões sobre os seus cuidados?",
    },
    options: [
      { id: "independently", label: { en: "Yes, independently", pt: "Sim, autonomamente" } },
      { id: "with_support", label: { en: "Yes, with support", pt: "Sim, com apoio" } },
      { id: "no", label: NO },
      { id: "not_known", label: { en: "Not known", pt: "Desconhecido" }, unsure: true, flag: "capacity_unknown" },
    ],
    showIf: (a) => a.A1 !== "self",
  },
  {
    id: "A4",
    section: "about",
    label: {
      en: "Has the person agreed to this request and to the relevant information being shared with the matched professional?",
      pt: "A pessoa concordou com este pedido e com a partilha da informação necessária com o profissional selecionado?",
    },
    options: [
      { id: "yes", label: YES },
      { id: "no", label: NO, flag: "agreement_unclear" },
      {
        id: "representative",
        label: {
          en: "Not applicable because a lawful representative is acting",
          pt: "Não aplicável porque atua um representante legítimo",
        },
      },
      { id: "not_sure", label: NOT_SURE, unsure: true, flag: "agreement_unclear" },
    ],
    showIf: (a) => a.A1 !== "self",
  },

  // 5 — basic service information
  {
    id: "B1",
    section: "service",
    label: { en: "Who needs support?", pt: "Quem necessita de apoio?" },
    options: [
      { id: "adult", label: { en: "Adult", pt: "Adulto" } },
      { id: "child", label: { en: "Child or young person", pt: "Criança ou jovem" }, flag: "child_involved" },
    ],
  },
  {
    id: "B2",
    section: "service",
    label: { en: "What is the main reason for the request?", pt: "Qual é o principal motivo do pedido?" },
    options: [
      { id: "companionship", label: { en: "Companionship and supervision", pt: "Companhia e supervisão" } },
      { id: "daily_activities", label: { en: "Help with daily activities", pt: "Ajuda nas atividades diárias" } },
      { id: "personal_care", label: { en: "Personal care", pt: "Cuidados pessoais" } },
      {
        id: "recovery",
        label: { en: "Recovery after hospital discharge or surgery", pt: "Recuperação após alta hospitalar ou cirurgia" },
      },
      {
        id: "nursing",
        label: { en: "Nursing procedure or clinical monitoring", pt: "Procedimento de enfermagem ou vigilância clínica" },
        flag: "nursing_requested",
      },
      { id: "rehab", label: { en: "Mobility or rehabilitation", pt: "Mobilidade ou reabilitação" } },
      { id: "childcare", label: { en: "Childcare", pt: "Cuidados infantis" } },
      { id: "other", label: { en: "Other", pt: "Outro" } },
    ],
  },
  {
    id: "B3",
    section: "service",
    label: { en: "When is support needed?", pt: "Quando é necessário o apoio?" },
    options: [
      { id: "one_off", label: { en: "One-off visit", pt: "Visita pontual" } },
      { id: "daytime", label: { en: "Regular daytime support", pt: "Apoio diurno regular" } },
      { id: "overnight", label: { en: "Regular overnight support", pt: "Apoio noturno regular" } },
      { id: "live_in", label: { en: "Live-in or continuous support", pt: "Apoio interno ou contínuo" } },
      { id: "not_sure", label: NOT_SURE, unsure: true },
    ],
  },
  {
    id: "B4",
    section: "service",
    label: {
      en: "Has the person been discharged from hospital or had surgery within the last 30 days?",
      pt: "A pessoa teve alta hospitalar ou foi submetida a cirurgia nos últimos 30 dias?",
    },
    options: [
      { id: "no", label: NO },
      { id: "with_plan", label: { en: "Yes, with a written care plan", pt: "Sim, com plano de cuidados escrito" }, flag: "recent_discharge" },
      { id: "without_plan", label: { en: "Yes, without a written care plan", pt: "Sim, sem plano de cuidados" }, flag: "discharge_without_plan" },
      { id: "planned", label: { en: "Planned discharge", pt: "Alta prevista" }, flag: "recent_discharge" },
    ],
  },

  // 6 — daily living and dependency (adults)
  daily("D1", "Moving around indoors", "Deslocação dentro de casa"),
  daily("D2", "Transfers between bed, chair or toilet", "Transferências entre cama, cadeira ou sanita"),
  daily("D3", "Washing, bathing and dressing", "Higiene, banho e vestir"),
  daily("D4", "Using the toilet and continence support", "Utilização da casa de banho e apoio na continência"),
  daily("D5", "Eating and drinking", "Alimentação e hidratação"),
  daily("D6", "Preparing meals and essential household tasks", "Preparação de refeições e tarefas domésticas essenciais"),
  daily("D7", "Communication and understanding instructions", "Comunicação e compreensão de instruções"),
  daily("D8", "Supervision to remain safe", "Supervisão para permanecer em segurança"),

  // 7 — mobility, falls and environment
  {
    id: "M1",
    section: "mobility",
    label: { en: "Has the person fallen in the last 12 months?", pt: "A pessoa sofreu alguma queda nos últimos 12 meses?" },
    options: [
      { id: "no", label: NO, points: 0 },
      { id: "one", label: { en: "One fall without injury", pt: "Uma queda sem lesão" }, points: 1 },
      {
        id: "recurrent",
        label: { en: "One fall with injury or two or more falls", pt: "Uma queda com lesão ou duas ou mais quedas" },
        points: 3,
        flag: "falls_risk",
      },
    ],
    showIf: isAdult,
  },
  {
    id: "M2",
    section: "mobility",
    label: { en: "Does the person use mobility or transfer equipment?", pt: "A pessoa utiliza equipamento de mobilidade ou transferência?" },
    options: [
      { id: "no", label: NO },
      { id: "aid", label: { en: "Walking stick, frame or wheelchair", pt: "Bengala, andarilho ou cadeira de rodas" } },
      {
        id: "specialist",
        label: { en: "Hoist, transfer board or specialist equipment", pt: "Elevador de transferência, tábua ou equipamento específico" },
        flag: "manual_handling",
      },
    ],
    showIf: isAdult,
  },
  {
    id: "M3",
    section: "mobility",
    label: {
      en: "Is the home access or working environment potentially unsafe?",
      pt: "O acesso à habitação ou o ambiente de trabalho apresenta riscos?",
    },
    options: [
      { id: "none", label: { en: "No known hazards", pt: "Sem riscos conhecidos" }, points: 0 },
      {
        id: "hazards",
        label: {
          en: "Stairs, clutter, pets, smoking, poor lighting or limited space",
          pt: "Escadas, obstáculos, animais, fumo, iluminação insuficiente ou espaço reduzido",
        },
        points: 2,
        flag: "home_hazards",
      },
      {
        id: "serious",
        label: {
          en: "Known aggression, weapons, illegal activity or serious environmental danger",
          pt: "Agressividade conhecida, armas, atividade ilegal ou perigo ambiental grave",
        },
        points: 4,
        flag: "serious_danger",
      },
    ],
  },
  {
    id: "M4",
    section: "mobility",
    label: {
      en: "Will the professional ever be expected to lift the person manually without suitable equipment?",
      pt: "É esperado que o profissional levante manualmente a pessoa sem equipamento adequado?",
    },
    options: [
      { id: "no", label: NO },
      { id: "yes", label: YES, flag: "manual_lifting" },
      { id: "not_sure", label: NOT_SURE, unsure: true, flag: "manual_lifting" },
    ],
    // Only relevant where the person needs help moving or uses equipment.
    showIf: (a) =>
      isAdult(a) && (["1", "2", "3"].includes(a.D1) || ["1", "2", "3"].includes(a.D2) || (a.M2 !== undefined && a.M2 !== "no")),
  },

  // 8 — clinical and nursing needs (adults; the child branch has K3)
  {
    id: "C1",
    section: "clinical",
    label: { en: "Does the person need help with medicines?", pt: "A pessoa necessita de ajuda com medicamentos?" },
    options: [
      { id: "no", label: NO },
      { id: "reminder", label: { en: "Reminder or prompting only", pt: "Apenas lembrete ou orientação" } },
      {
        id: "prepare",
        label: {
          en: "Help opening/preparing medicines from an agreed plan",
          pt: "Ajuda a abrir ou preparar medicamentos segundo plano definido",
        },
      },
      {
        id: "administer",
        label: {
          en: "Administration, injection, controlled medicine, PRN decision or clinical judgement",
          pt: "Administração, injeção, medicamento controlado, decisão SOS ou julgamento clínico",
        },
        flag: "medicine_administration",
      },
    ],
    showIf: isAdult,
  },
  {
    id: "C2",
    section: "clinical",
    label: { en: "Are any nursing procedures required?", pt: "É necessário algum procedimento de enfermagem?" },
    options: [
      { id: "none", label: { en: "None", pt: "Nenhum" } },
      { id: "wound", label: { en: "Wound or pressure-area care", pt: "Cuidados de ferida ou zona de pressão" }, flag: "nursing_procedure" },
      {
        id: "injection",
        label: { en: "Injection, IV therapy or blood sampling", pt: "Injeção, terapêutica intravenosa ou colheita de sangue" },
        flag: "nursing_procedure",
      },
      {
        id: "device",
        label: {
          en: "PEG/enteral feeding, catheter, stoma, tracheostomy, suction or other device",
          pt: "PEG/alimentação entérica, cateter, estoma, traqueostomia, aspiração ou outro dispositivo",
        },
        flag: "nursing_procedure",
      },
    ],
    showIf: clinicalContext,
  },
  {
    id: "C3",
    section: "clinical",
    label: { en: "Does the person need clinical observations or monitoring?", pt: "A pessoa necessita de observações ou vigilância clínica?" },
    options: [
      { id: "no", label: NO },
      {
        id: "routine",
        label: {
          en: "Routine readings already planned, with clear escalation instructions",
          pt: "Medições de rotina já planeadas, com instruções claras de escalada",
        },
      },
      {
        id: "changing",
        label: {
          en: "Assessment, interpretation or response to changing observations",
          pt: "Avaliação, interpretação ou resposta a alterações clínicas",
        },
        flag: "clinical_monitoring",
      },
    ],
    showIf: clinicalContext,
  },
  {
    id: "C4",
    section: "clinical",
    label: {
      en: "Does the person have a condition that is currently unstable or worsening?",
      pt: "A pessoa tem uma condição atualmente instável ou em agravamento?",
    },
    options: [
      { id: "no", label: NO },
      { id: "not_sure", label: NOT_SURE, unsure: true, flag: "clinical_need_unclear" },
      { id: "yes", label: YES, flag: "unstable_condition" },
    ],
    showIf: isAdult,
  },
  {
    id: "C5",
    section: "clinical",
    label: {
      en: "Are there swallowing difficulties, repeated choking, significant weight loss or dehydration concerns?",
      pt: "Existem dificuldades em engolir, engasgamentos repetidos, perda significativa de peso ou preocupação com desidratação?",
    },
    options: [
      { id: "no", label: NO },
      { id: "possible", label: { en: "Possible or mild concern", pt: "Possível ou preocupação ligeira" }, flag: "swallowing_concern" },
      {
        id: "confirmed",
        label: { en: "Confirmed/recurrent or without a current plan", pt: "Confirmado/recorrente ou sem plano atual" },
        flag: "swallowing_risk",
      },
    ],
    showIf: isAdult,
  },
  {
    id: "C6",
    section: "clinical",
    label: { en: "Is oxygen, ventilation or respiratory equipment used?", pt: "É utilizado oxigénio, ventilação ou equipamento respiratório?" },
    options: [
      { id: "no", label: NO },
      { id: "stable", label: { en: "Yes, stable with a written plan", pt: "Sim, estável e com plano escrito" }, flag: "respiratory_equipment" },
      {
        id: "unplanned",
        label: {
          en: "Yes, without a clear plan or with recent deterioration",
          pt: "Sim, sem plano claro ou com agravamento recente",
        },
        flag: "respiratory_equipment",
      },
    ],
    showIf: isAdult,
  },

  // 9 — cognition, behaviour, mental health and safeguarding
  {
    id: "S1",
    section: "wellbeing",
    label: {
      en: "Does the person have memory loss, confusion, dementia or difficulty recognising risks?",
      pt: "A pessoa apresenta perda de memória, confusão, demência ou dificuldade em reconhecer riscos?",
    },
    options: [
      { id: "no", label: NO, points: 0 },
      { id: "mild", label: { en: "Mild and managed", pt: "Ligeiro e controlado" }, points: 2 },
      {
        id: "severe",
        label: {
          en: "Moderate/severe, wandering or leaving home unsafely",
          pt: "Moderado/grave, deambulação ou saída insegura de casa",
        },
        points: 4,
        flag: "cognition_risk",
      },
    ],
    showIf: isAdult,
  },
  {
    id: "S2",
    section: "wellbeing",
    label: {
      en: "Are there behaviours that may place the person or professional at risk?",
      pt: "Existem comportamentos que possam colocar a pessoa ou o profissional em risco?",
    },
    options: [
      { id: "no", label: NO, points: 0 },
      {
        id: "distress",
        label: { en: "Verbal distress, agitation or resistance to care", pt: "Angústia verbal, agitação ou resistência aos cuidados" },
        points: 2,
      },
      {
        id: "serious",
        label: {
          en: "Physical aggression, sexualised behaviour, fire-setting or serious unpredictable risk",
          pt: "Agressão física, comportamento sexualizado, fogo posto ou risco grave imprevisível",
        },
        points: 5,
        flag: "behaviour_risk",
      },
    ],
  },
  {
    id: "S3",
    section: "wellbeing",
    label: { en: "Are there current mental-health concerns?", pt: "Existem preocupações atuais de saúde mental?" },
    options: [
      { id: "no", label: NO, points: 0 },
      { id: "stable", label: { en: "Stable with support or treatment", pt: "Estável com apoio ou tratamento" }, points: 1 },
      {
        id: "crisis",
        label: {
          en: "Recent crisis, psychosis, severe deterioration or self-neglect",
          pt: "Crise recente, psicose, agravamento grave ou autoabandono",
        },
        points: 4,
        flag: "mental_health_crisis",
      },
    ],
    showIf: (a) => isAdult(a) || a.K1 === "12_17",
  },
  {
    id: "S4",
    section: "wellbeing",
    label: {
      en: "Are there any concerns about abuse, neglect, exploitation, coercion or unsafe care?",
      pt: "Existem preocupações relativas a abuso, negligência, exploração, coação ou cuidados inseguros?",
    },
    options: [
      { id: "no", label: NO, points: 0 },
      { id: "possible", label: { en: "Possible concern", pt: "Possível preocupação" }, points: 3, flag: "safeguarding_possible" },
      { id: "known", label: { en: "Known or current concern", pt: "Preocupação conhecida ou atual" }, points: 6, flag: "safeguarding_known" },
    ],
  },
  {
    id: "S5",
    section: "wellbeing",
    label: {
      en: "Is a child or vulnerable adult involved in the service request?",
      pt: "Está envolvida no pedido uma criança ou um adulto vulnerável?",
    },
    options: [
      { id: "no", label: NO },
      { id: "yes", label: YES, flag: "vulnerable_person" },
    ],
    // A child request already involves a child.
    showIf: isAdult,
  },

  // 10 — infection, allergy and lone working
  {
    id: "R1",
    section: "risks",
    label: {
      en: "Is there a known contagious infection or requirement for specific infection-control precautions?",
      pt: "Existe infeção contagiosa conhecida ou necessidade de precauções específicas de controlo de infeção?",
    },
    options: [
      { id: "no", label: NO, points: 0 },
      { id: "precautions", label: { en: "Yes, with clear precautions", pt: "Sim, com precauções claras" }, points: 2 },
      {
        id: "unmanaged",
        label: { en: "Yes or suspected, without guidance", pt: "Sim ou suspeita, sem orientação" },
        points: 4,
        flag: "infection_unmanaged",
      },
    ],
  },
  {
    id: "R2",
    section: "risks",
    label: { en: "Does the person have any serious allergies?", pt: "A pessoa tem alergias graves?" },
    options: [
      { id: "no", label: { en: "No known serious allergy", pt: "Sem alergia grave conhecida" }, points: 0 },
      { id: "plan", label: { en: "Yes, documented with an action plan", pt: "Sim, documentada e com plano de atuação" }, points: 2 },
      {
        id: "unmanaged",
        label: { en: "Yes or suspected, without a plan", pt: "Sim ou suspeita, sem plano" },
        points: 4,
        flag: "allergy_unmanaged",
      },
    ],
  },
  {
    id: "R3",
    section: "risks",
    label: { en: "Will the professional work alone?", pt: "O profissional trabalhará sozinho?" },
    options: [
      { id: "no", label: NO },
      { id: "routine", label: { en: "Yes, routine setting", pt: "Sim, contexto habitual" } },
      {
        id: "higher_risk",
        label: { en: "Yes, with identified risks or overnight", pt: "Sim, com riscos identificados ou durante a noite" },
        flag: "lone_working_risk",
      },
    ],
  },
  {
    id: "R4",
    section: "risks",
    label: { en: "Are animals present in the home?", pt: "Existem animais na habitação?" },
    options: [
      { id: "no", label: NO },
      { id: "secured", label: { en: "Yes, secured if required", pt: "Sim, controlados quando necessário" } },
      {
        id: "aggressive",
        label: {
          en: "Yes, with known aggressive or uncontrolled behaviour",
          pt: "Sim, com comportamento agressivo conhecido ou não controlado",
        },
        flag: "aggressive_animal",
      },
    ],
  },
  {
    id: "R5",
    section: "risks",
    label: {
      en: "Is there safe access, parking/transport information and a working phone signal or contact method?",
      pt: "Existe acesso seguro, informação de estacionamento/transporte e sinal telefónico ou meio de contacto funcional?",
    },
    options: [
      { id: "yes", label: YES, points: 0 },
      { id: "partly", label: { en: "Partly", pt: "Parcialmente" }, points: 2 },
      { id: "no", label: { en: "No or not known", pt: "Não ou desconhecido" }, points: 4, unsure: true, flag: "access_unsafe" },
    ],
  },

  // 11 — children and childcare (only when B1 = child)
  {
    id: "K1",
    section: "child",
    label: { en: "What is the child's age?", pt: "Qual é a idade da criança?" },
    options: [
      { id: "under_1", label: { en: "Under 1 year", pt: "Menos de 1 ano" } },
      { id: "1_4", label: { en: "1–4 years", pt: "1–4 anos" } },
      { id: "5_11", label: { en: "5–11 years", pt: "5–11 anos" } },
      { id: "12_17", label: { en: "12–17 years", pt: "12–17 anos" } },
    ],
    showIf: isChild,
  },
  {
    id: "K2",
    section: "child",
    label: {
      en: "Does the child have additional health, developmental, communication or behavioural needs?",
      pt: "A criança tem necessidades adicionais de saúde, desenvolvimento, comunicação ou comportamento?",
    },
    options: [
      { id: "no", label: NO },
      { id: "stable", label: { en: "Yes, stable with a clear plan", pt: "Sim, estáveis e com plano claro" } },
      {
        id: "complex",
        label: { en: "Yes, complex, changing or without a plan", pt: "Sim, complexas, em alteração ou sem plano" },
        flag: "child_complex_needs",
      },
    ],
    showIf: isChild,
  },
  {
    id: "K3",
    section: "child",
    label: {
      en: "Does the child require medicines, tube feeding, seizure management, oxygen or another clinical procedure?",
      pt: "A criança necessita de medicamentos, alimentação por sonda, controlo de convulsões, oxigénio ou outro procedimento clínico?",
    },
    options: [
      { id: "no", label: NO },
      { id: "yes", label: YES, flag: "child_clinical_procedure" },
      { id: "not_sure", label: NOT_SURE, unsure: true, flag: "clinical_need_unclear" },
    ],
    showIf: isChild,
  },
  {
    id: "K4",
    section: "child",
    label: {
      en: "Who has parental responsibility or legal authority to arrange the service?",
      pt: "Quem tem responsabilidade parental ou legitimidade para contratar o serviço?",
    },
    options: [
      { id: "parent", label: { en: "Parent/person with parental responsibility", pt: "Progenitor ou pessoa com responsabilidade parental" } },
      { id: "guardian", label: { en: "Lawful guardian/representative", pt: "Tutor ou representante legal" } },
      { id: "social_service", label: { en: "Social service or authorised organisation", pt: "Serviço social ou organização autorizada" } },
      { id: "not_clear", label: { en: "Not clear", pt: "Não está claro" }, unsure: true, flag: "authority_unclear" },
    ],
    showIf: isChild,
  },
];

/** Flags: their level and the label admins see. Safeguarding flags are never shown to professionals. */
export const FLAGS: Record<string, { level: FlagLevel; label: Text }> = {
  authority_unclear: { level: "red", label: { en: "Legal authority not confirmed", pt: "Legitimidade não confirmada" } },
  capacity_unknown: { level: "amber", label: { en: "Ability to take part in decisions not known", pt: "Capacidade de participar nas decisões desconhecida" } },
  agreement_unclear: { level: "red", label: { en: "Person's agreement not confirmed", pt: "Concordância da pessoa não confirmada" } },
  child_involved: { level: "amber", label: { en: "Child — authority and safeguarding checks required", pt: "Criança — verificações de legitimidade e proteção obrigatórias" } },
  nursing_requested: { level: "nursing", label: { en: "Nursing procedure or clinical monitoring requested", pt: "Pedido de procedimento de enfermagem ou vigilância clínica" } },
  recent_discharge: { level: "amber", label: { en: "Hospital discharge or surgery in the last 30 days", pt: "Alta hospitalar ou cirurgia nos últimos 30 dias" } },
  discharge_without_plan: { level: "nursing", label: { en: "Recent discharge without a care plan", pt: "Alta recente sem plano de cuidados" } },
  manual_handling: { level: "amber", label: { en: "Manual-handling review: two people, hoist or specialist equipment", pt: "Revisão de movimentação manual: duas pessoas, elevador ou equipamento específico" } },
  falls_risk: { level: "amber", label: { en: "Fall with injury or recurrent falls", pt: "Queda com lesão ou quedas recorrentes" } },
  home_hazards: { level: "amber", label: { en: "Hazards in the home", pt: "Riscos na habitação" } },
  serious_danger: { level: "scope", label: { en: "Serious danger in the home — do not publish until controlled", pt: "Perigo grave na habitação — não publicar até estar controlado" } },
  manual_lifting: { level: "amber", label: { en: "Manual lifting without suitable equipment expected or unknown", pt: "Levantamento manual sem equipamento esperado ou desconhecido" } },
  medicine_administration: { level: "nursing", label: { en: "Medicine administration or clinical judgement", pt: "Administração de medicamentos ou julgamento clínico" } },
  nursing_procedure: { level: "nursing", label: { en: "Nursing procedure required", pt: "Procedimento de enfermagem necessário" } },
  clinical_monitoring: { level: "nursing", label: { en: "Response to changing observations", pt: "Resposta a alterações clínicas" } },
  unstable_condition: { level: "nursing", label: { en: "Unstable or worsening condition", pt: "Condição instável ou em agravamento" } },
  clinical_need_unclear: { level: "amber", label: { en: "Clinical need unclear (\"Not sure\")", pt: "Necessidade clínica pouco clara (\"Não tenho a certeza\")" } },
  swallowing_concern: { level: "amber", label: { en: "Possible swallowing or nutrition concern", pt: "Possível preocupação com deglutição ou nutrição" } },
  swallowing_risk: { level: "nursing", label: { en: "Confirmed or recurrent swallowing risk", pt: "Risco de deglutição confirmado ou recorrente" } },
  respiratory_equipment: { level: "nursing", label: { en: "Oxygen, ventilation or respiratory equipment", pt: "Oxigénio, ventilação ou equipamento respiratório" } },
  cognition_risk: { level: "amber", label: { en: "Moderate/severe confusion or wandering", pt: "Confusão moderada/grave ou deambulação" } },
  behaviour_risk: { level: "red", label: { en: "Serious behaviour risk", pt: "Risco comportamental grave" } },
  mental_health_crisis: { level: "red", label: { en: "Recent mental-health crisis", pt: "Crise recente de saúde mental" } },
  safeguarding_possible: { level: "amber", label: { en: "Possible safeguarding concern", pt: "Possível preocupação de proteção" } },
  safeguarding_known: { level: "red", label: { en: "Known safeguarding concern", pt: "Preocupação de proteção conhecida" } },
  vulnerable_person: { level: "amber", label: { en: "Child or vulnerable adult involved", pt: "Criança ou adulto vulnerável envolvido" } },
  infection_unmanaged: { level: "amber", label: { en: "Infection without guidance", pt: "Infeção sem orientação" } },
  allergy_unmanaged: { level: "amber", label: { en: "Serious allergy without a plan", pt: "Alergia grave sem plano" } },
  lone_working_risk: { level: "amber", label: { en: "Higher-risk or overnight lone working", pt: "Trabalho isolado de maior risco ou noturno" } },
  aggressive_animal: { level: "scope", label: { en: "Aggressive or uncontrolled animal — do not publish until controlled", pt: "Animal agressivo ou não controlado — não publicar até estar controlado" } },
  access_unsafe: { level: "amber", label: { en: "Unsafe or unknown access or contact", pt: "Acesso ou contacto inseguro ou desconhecido" } },
  child_complex_needs: { level: "amber", label: { en: "Child with complex or changing needs", pt: "Criança com necessidades complexas ou em alteração" } },
  child_clinical_procedure: { level: "nursing", label: { en: "Child needs a clinical procedure", pt: "Criança necessita de procedimento clínico" } },
  important_not_sure: { level: "amber", label: { en: "Important answer was \"Not sure\"", pt: "Resposta importante \"Não tenho a certeza\"" } },
  score_amber: { level: "amber", label: { en: "Score 8–15", pt: "Pontuação 8–15" } },
  score_red: { level: "red", label: { en: "Score 16 or more", pt: "Pontuação de 16 ou mais" } },
  childcare_for_adult: { level: "amber", label: { en: "Childcare requested for an adult", pt: "Cuidados infantis pedidos para um adulto" } },
  role_differs: { level: "amber", label: { en: "Booked role differs from the recommendation", pt: "A categoria reservada difere da recomendação" } },
};

/** Score bands (section 12): green 0–7, amber 8–15, red 16+. */
export const AMBER_FROM = 8;
export const RED_FROM = 16;

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
  support: { en: "Support professional / healthcare assistant", pt: "Profissional de apoio / auxiliar de saúde" },
  nurse_adult: { en: "Nurse", pt: "Enfermeiro(a)" },
  nurse_child: { en: "Children's nurse", pt: "Enfermeiro(a) pediátrico(a)" },
  nurse_mental_health: { en: "Mental health nurse", pt: "Enfermeiro(a) de saúde mental" },
  physio: { en: "Physiotherapist", pt: "Fisioterapeuta" },
  childcare: { en: "Childcare professional", pt: "Profissional de cuidados infantis" },
};

export type Outcome = "G" | "P" | "A" | "N" | "X";

export const OUTCOME_LABEL: Record<Outcome, Text> = {
  G: { en: "Standard support", pt: "Apoio padrão" },
  P: { en: "Physiotherapy", pt: "Fisioterapia" },
  A: { en: "Admin review", pt: "Análise administrativa" },
  N: { en: "Nursing care — nurse only", pt: "Cuidados de enfermagem — apenas enfermeiro" },
  X: { en: "Possibly outside current scope", pt: "Possivelmente fora do âmbito" },
};

export const BAND_LABEL: Record<"green" | "amber" | "red", Text> = {
  green: { en: "Green", pt: "Verde" },
  amber: { en: "Amber", pt: "Amarelo" },
  red: { en: "Red", pt: "Vermelho" },
};

/** Section 19: what the client is told. */
export const CLIENT_RESULT: Record<"standard" | "physio" | "review" | "nursing", Text> = {
  standard: {
    en: "Based on the information provided, your request may be suitable for a support professional. This recommendation will be confirmed before the service begins.",
    pt: "Com base nas informações fornecidas, o seu pedido poderá ser adequado a um profissional de apoio. A recomendação será confirmada antes do início do serviço.",
  },
  physio: {
    en: "Based on the information provided, your request may be suitable for a physiotherapist. This recommendation will be confirmed before the service begins.",
    pt: "Com base nas informações fornecidas, o seu pedido poderá ser adequado a um fisioterapeuta. A recomendação será confirmada antes do início do serviço.",
  },
  review: {
    en: "We need to review some of the information before publishing your request. A CareBridge team member will contact you.",
    pt: "Precisamos de analisar algumas informações antes de publicar o pedido. Um elemento da equipa CareBridge entrará em contacto consigo.",
  },
  nursing: {
    en: "The information provided suggests that nursing skills may be required. Your request will be reviewed and, if appropriate, matched only with a verified nurse.",
    pt: "As informações fornecidas indicam que poderão ser necessários cuidados de enfermagem. O pedido será analisado e, se adequado, encaminhado apenas para um enfermeiro verificado.",
  },
};

export const EMERGENCY_RESULT: Text = {
  en: "This service cannot be used for emergencies. Call 112 now if the person is in immediate danger or has a serious or life-threatening problem.",
  pt: "Este serviço não pode ser utilizado em emergências. Ligue agora para o 112 se a pessoa estiver em perigo imediato ou apresentar uma situação grave ou com risco de vida.",
};
