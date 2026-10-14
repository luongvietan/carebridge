import {
  EMERGENCY_QUESTIONS,
  HIGH_FROM,
  MEDIUM_FROM,
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  RESPONDENT_OPTIONS,
  ROLE_FAMILY_BY_CODE,
  UNCLEAR_FROM_UNSURE,
  type Respondent,
  type RoleFamily,
} from "./questionnaire";

export type RiskLevel = "low" | "medium" | "high" | "unclear";

/** What the client submits: who is answering, the emergency screen, and one option per question. */
export type RiskSubmission = {
  version: string;
  respondent: Respondent;
  /** Emergency question id → true when answered "yes". */
  emergency: Record<string, boolean>;
  /** Question id → option id. */
  answers: Record<string, string>;
  consent: boolean;
};

export type RiskResult = {
  score: number;
  level: RiskLevel;
  recommendedFamily: RoleFamily;
  /** Why the request must be reviewed, before the booked role is known. */
  reasons: string[];
  unsureCount: number;
};

export type SubmissionError =
  | "outdated"
  | "respondent"
  | "emergency"
  | "unanswered"
  | "consent";

/**
 * Checks a submission is complete and current. An emergency answer is an error
 * here on purpose: the form stops before sending, and the server refuses too.
 */
export function validateSubmission(s: RiskSubmission): SubmissionError | null {
  if (s.version !== QUESTIONNAIRE_VERSION) return "outdated";
  if (!RESPONDENT_OPTIONS.some((r) => r.id === s.respondent)) return "respondent";
  if (isEmergency(s.emergency)) return "emergency";
  for (const q of EMERGENCY_QUESTIONS) if (typeof s.emergency[q.id] !== "boolean") return "unanswered";
  for (const q of QUESTIONS) {
    if (!q.options.some((o) => o.id === s.answers[q.id])) return "unanswered";
  }
  if (!s.consent) return "consent";
  return null;
}

export function isEmergency(emergency: Record<string, boolean>): boolean {
  return EMERGENCY_QUESTIONS.some((q) => emergency[q.id] === true);
}

function recommend(answers: Record<string, string>): { family: RoleFamily; inconsistent: boolean } {
  const child = answers.person === "child";
  const support = answers.support_type;
  if (answers.mental_health === "crisis") return { family: "nurse_mental_health", inconsistent: false };
  if (support === "clinical" || answers.medication === "administer") {
    return { family: child ? "nurse_child" : "nurse_adult", inconsistent: false };
  }
  if (support === "rehab") return { family: "physio", inconsistent: false };
  if (support === "childcare") return { family: "childcare", inconsistent: !child };
  return { family: child ? "childcare" : "support", inconsistent: false };
}

/** Pure scoring of a complete, validated submission. */
export function scoreRisk(answers: Record<string, string>): RiskResult {
  let score = 0;
  let unsureCount = 0;
  const escalations: string[] = [];
  for (const q of QUESTIONS) {
    const option = q.options.find((o) => o.id === answers[q.id]);
    if (!option) continue;
    score += option.points;
    if (option.unsure) unsureCount += 1;
    if (option.escalate) escalations.push(option.escalate);
  }
  const { family, inconsistent } = recommend(answers);

  const reasons: string[] = [];
  let level: RiskLevel;
  if (escalations.length > 0 || score >= HIGH_FROM) {
    level = "high";
    if (score >= HIGH_FROM) reasons.push("high_risk");
    reasons.push(...escalations);
  } else if (unsureCount >= UNCLEAR_FROM_UNSURE || inconsistent) {
    level = "unclear";
    reasons.push(inconsistent ? "inconsistent" : "unclear");
  } else {
    level = score >= MEDIUM_FROM ? "medium" : "low";
  }
  return { score, level, recommendedFamily: family, reasons, unsureCount };
}

/**
 * Whether booking `chosenRoleCode` is a safe match for the recommendation. A
 * nurse where a support worker would do is fine (more qualified); anything
 * else that differs — or a role outside the known families — needs review.
 */
export function roleMatchesRecommendation(recommended: RoleFamily, chosenRoleCode: string): boolean {
  const chosen = ROLE_FAMILY_BY_CODE[chosenRoleCode];
  if (!chosen) return false;
  if (chosen === recommended) return true;
  return recommended === "support" && chosen.startsWith("nurse_");
}

export function roleFamilyOf(roleCode: string): RoleFamily | null {
  return ROLE_FAMILY_BY_CODE[roleCode] ?? null;
}

/** The final decision for a booking: review reasons including the booked role. */
export function reviewDecision(result: RiskResult, chosenRoleCode: string): { requiresReview: boolean; reasons: string[] } {
  const reasons = [...result.reasons];
  if (!roleMatchesRecommendation(result.recommendedFamily, chosenRoleCode)) reasons.push("role_differs");
  return { requiresReview: reasons.length > 0, reasons };
}
