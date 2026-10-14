import {
  AMBER_FROM,
  EMERGENCY_QUESTIONS,
  FLAGS,
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  RED_FROM,
  RESPONDENT_OPTIONS,
  ROLE_FAMILY_BY_CODE,
  type Answers,
  type Outcome,
  type Question,
  type Respondent,
  type RoleFamily,
} from "./questionnaire";

export type Band = "green" | "amber" | "red";

/** What the client submits. `answers` holds only the questions shown to them. */
export type RiskSubmission = {
  version: string;
  respondent: Respondent;
  /** Emergency question id → true when answered "Yes". */
  emergency: Record<string, boolean>;
  /** Question id → option id. */
  answers: Answers;
  /** Privacy notice read and consent to process the health information. */
  consent: boolean;
};

export type RiskResult = {
  score: number;
  band: Band;
  outcome: Outcome;
  flags: string[];
  recommendedFamily: RoleFamily;
  unsureCount: number;
};

export type SubmissionError = "outdated" | "respondent" | "emergency" | "unanswered" | "consent";

/** The answers as the visibility rules see them: who is answering counts as A1. */
export function withRespondent(respondent: string | undefined, answers: Answers): Answers {
  return respondent ? { ...answers, A1: respondent } : answers;
}

/**
 * The questions shown for these answers, in order. Visibility depends only on
 * earlier answers, so walking in order and adding each answer as it is reached
 * gives the same result in the browser and on the server.
 */
export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

export function isEmergency(emergency: Record<string, boolean>): boolean {
  return EMERGENCY_QUESTIONS.some((q) => emergency[q.id] === true);
}

/**
 * A submission is complete and current: every emergency question answered
 * "No", every shown question answered with one of its options, and consent
 * given. Emergencies are an error on purpose — nothing is stored for them.
 */
export function validateSubmission(s: RiskSubmission): SubmissionError | null {
  if (s.version !== QUESTIONNAIRE_VERSION) return "outdated";
  if (!RESPONDENT_OPTIONS.some((r) => r.id === s.respondent)) return "respondent";
  if (isEmergency(s.emergency)) return "emergency";
  for (const q of EMERGENCY_QUESTIONS) if (s.emergency[q.id] !== false) return "unanswered";
  if (!s.consent) return "consent";
  const answers = withRespondent(s.respondent, s.answers);
  for (const q of visibleQuestions(answers)) {
    if (!q.options.some((o) => o.id === answers[q.id])) return "unanswered";
  }
  return null;
}

/** Only the answers to questions actually shown — hidden ones are dropped before storing. */
export function visibleAnswers(respondent: Respondent, answers: Answers): Answers {
  const all = withRespondent(respondent, answers);
  return Object.fromEntries(visibleQuestions(all).map((q) => [q.id, answers[q.id]]));
}

function recommend(a: Answers, flags: Set<string>): RoleFamily {
  const child = a.B1 === "child";
  const nursing = [...flags].some((f) => FLAGS[f]?.level === "nursing");
  if (nursing) return child ? "nurse_child" : "nurse_adult";
  if (flags.has("mental_health_crisis")) return "nurse_mental_health";
  if (a.B2 === "rehab") return "physio";
  if (child) return "childcare";
  return "support";
}

/** Scores a complete, validated submission (sections 12 and 13 of Ana's spec). */
export function assessRisk(respondent: Respondent, rawAnswers: Answers): RiskResult {
  const a = withRespondent(respondent, rawAnswers);
  const flags = new Set<string>();
  let score = 0;
  let unsureCount = 0;
  for (const q of visibleQuestions(a)) {
    const option = q.options.find((o) => o.id === a[q.id]);
    if (!option) continue;
    score += option.points ?? 0;
    if (option.unsure) unsureCount += 1;
    if (option.flag) flags.add(option.flag);
    // Any dependency item at 3: two people, equipment or continuous supervision.
    if (q.section === "daily" && option.id === "3") flags.add("manual_handling");
  }
  if (a.B1 === "adult" && a.B2 === "childcare") flags.add("childcare_for_adult");
  // A single routine "Not sure" (e.g. timing) is not enough on its own, but several are.
  if (unsureCount >= 2) flags.add("important_not_sure");
  if (score >= RED_FROM) flags.add("score_red");
  else if (score >= AMBER_FROM) flags.add("score_amber");

  const levels = [...flags].map((f) => FLAGS[f]?.level ?? "amber");
  const outcome: Outcome = levels.includes("scope")
    ? "X"
    : levels.includes("nursing")
      ? "N"
      : levels.length > 0
        ? "A"
        : a.B2 === "rehab"
          ? "P"
          : "G";
  const band: Band = levels.some((l) => l === "red" || l === "nursing" || l === "scope")
    ? "red"
    : levels.length > 0
      ? "amber"
      : "green";
  return { score, band, outcome, flags: [...flags], recommendedFamily: recommend(a, flags), unsureCount };
}

const NURSE_FAMILIES: RoleFamily[] = ["nurse_adult", "nurse_child", "nurse_mental_health"];

export function roleFamilyOf(roleCode: string): RoleFamily | null {
  return ROLE_FAMILY_BY_CODE[roleCode] ?? null;
}

/**
 * Whether booking `roleCode` matches the recommendation. A nurse where a
 * support professional would do is fine; anything else that differs needs review.
 */
export function roleMatchesRecommendation(recommended: RoleFamily, roleCode: string): boolean {
  const chosen = roleFamilyOf(roleCode);
  if (!chosen) return false;
  if (chosen === recommended) return true;
  return recommended === "support" && NURSE_FAMILIES.includes(chosen);
}

/** Nursing outcomes may only be booked with a nurse; the client cannot override that. */
export function roleAllowed(result: RiskResult, roleCode: string): boolean {
  if (result.outcome !== "N") return true;
  const chosen = roleFamilyOf(roleCode);
  return !!chosen && NURSE_FAMILIES.includes(chosen);
}

/**
 * Only green requests (no flag, score under 8) publish straight away — Ana's
 * pilot rule: medium, high and unclear cases are all held for admin review.
 */
export function reviewDecision(result: RiskResult, roleCode: string): { requiresReview: boolean; flags: string[] } {
  const flags = [...result.flags];
  if (!roleMatchesRecommendation(result.recommendedFamily, roleCode)) flags.push("role_differs");
  return { requiresReview: flags.length > 0, flags };
}

/** What the client is told after the assessment (section 19). */
export function clientResultKey(result: RiskResult): "standard" | "physio" | "review" | "nursing" {
  if (result.outcome === "N") return "nursing";
  if (result.outcome === "G") return "standard";
  if (result.outcome === "P") return "physio";
  return "review";
}

/**
 * Nursing (N) and red-risk requests are decided only by a clinical reviewer
 * (Ana, 15 October 2026); admins handle general and non-clinical cases.
 */
export function needsClinicalReview(band: string | null | undefined, outcome: string | null | undefined): boolean {
  return band === "red" || outcome === "N" || outcome === "X";
}
