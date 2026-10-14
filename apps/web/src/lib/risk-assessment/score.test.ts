import { describe, expect, it } from "vitest";
import { EMERGENCY_QUESTIONS, QUESTIONNAIRE_VERSION } from "./questionnaire";
import { reviewDecision, roleMatchesRecommendation, scoreRisk, validateSubmission, type RiskSubmission } from "./score";

const calm = {
  person: "adult",
  support_type: "companionship",
  mobility: "independent",
  medication: "none",
  cognition: "none",
  behaviour: "no",
  recent_change: "no",
  falls: "none",
  mental_health: "none",
  environment: "none",
  agreement: "yes",
};
const noEmergency = Object.fromEntries(EMERGENCY_QUESTIONS.map((q) => [q.id, false]));
const submission = (over: Partial<RiskSubmission> = {}): RiskSubmission => ({
  version: QUESTIONNAIRE_VERSION,
  respondent: "family",
  emergency: noEmergency,
  answers: calm,
  consent: true,
  ...over,
});

describe("validateSubmission", () => {
  it("accepts a complete, consented submission", () => {
    expect(validateSubmission(submission())).toBeNull();
  });
  it("refuses any emergency answer", () => {
    expect(validateSubmission(submission({ emergency: { ...noEmergency, e_danger: true } }))).toBe("emergency");
  });
  it("refuses missing answers, missing consent and an old version", () => {
    const partial: Record<string, string> = { ...calm };
    delete partial.falls;
    expect(validateSubmission(submission({ answers: partial }))).toBe("unanswered");
    expect(validateSubmission(submission({ answers: { ...calm, falls: "made_up" } }))).toBe("unanswered");
    expect(validateSubmission(submission({ consent: false }))).toBe("consent");
    expect(validateSubmission(submission({ version: "old" }))).toBe("outdated");
    expect(validateSubmission(submission({ emergency: {} }))).toBe("unanswered");
  });
});

describe("scoreRisk", () => {
  it("rates a calm companionship request low and recommends a support worker", () => {
    expect(scoreRisk(calm)).toMatchObject({ score: 0, level: "low", recommendedFamily: "support", reasons: [] });
  });

  it("recommends a nurse for clinical care or administered medication", () => {
    expect(scoreRisk({ ...calm, support_type: "clinical" }).recommendedFamily).toBe("nurse_adult");
    expect(scoreRisk({ ...calm, medication: "administer" }).recommendedFamily).toBe("nurse_adult");
    expect(scoreRisk({ ...calm, person: "child", support_type: "clinical" }).recommendedFamily).toBe("nurse_child");
  });

  it("recommends a physiotherapist, childcare, or a mental health nurse", () => {
    expect(scoreRisk({ ...calm, support_type: "rehab" }).recommendedFamily).toBe("physio");
    expect(scoreRisk({ ...calm, person: "child", support_type: "childcare" }).recommendedFamily).toBe("childcare");
    expect(scoreRisk({ ...calm, mental_health: "crisis" }).recommendedFamily).toBe("nurse_mental_health");
  });

  it("makes any escalating answer high risk, whatever the score", () => {
    const r = scoreRisk({ ...calm, environment: "serious" });
    expect(r.level).toBe("high");
    expect(r.reasons).toEqual(["unsafe_environment"]);
  });

  it("rates a medium score medium and a high total high", () => {
    const medium = scoreRisk({ ...calm, person: "older_adult", mobility: "full_help", medication: "reminders", cognition: "some", falls: "one" });
    expect(medium).toMatchObject({ score: 6, level: "medium", reasons: [] });
    const high = scoreRisk({
      ...calm,
      person: "older_adult",
      support_type: "clinical",
      mobility: "bed_bound",
      medication: "administer",
      cognition: "significant",
      falls: "two_plus",
    });
    expect(high.score).toBe(12);
    expect(high.level).toBe("high");
    expect(high.reasons).toEqual(["high_risk"]);
  });

  it("makes two or more 'Not sure' answers unclear", () => {
    expect(scoreRisk({ ...calm, mobility: "unsure" }).level).toBe("low");
    const r = scoreRisk({ ...calm, mobility: "unsure", falls: "unsure" });
    expect(r).toMatchObject({ level: "unclear", reasons: ["unclear"], unsureCount: 2 });
  });

  it("treats childcare for an adult as inconsistent", () => {
    expect(scoreRisk({ ...calm, support_type: "childcare" })).toMatchObject({ level: "unclear", reasons: ["inconsistent"] });
  });
});

describe("role matching", () => {
  it("accepts the recommended family and a nurse where support would do", () => {
    expect(roleMatchesRecommendation("support", "pt_auxiliar_saude")).toBe(true);
    expect(roleMatchesRecommendation("support", "pt_enfermeiro_adulto")).toBe(true);
    expect(roleMatchesRecommendation("nurse_adult", "pt_enfermeiro_adulto")).toBe(true);
  });
  it("flags a less qualified or different role, and unknown roles", () => {
    expect(roleMatchesRecommendation("nurse_adult", "pt_auxiliar_saude")).toBe(false);
    expect(roleMatchesRecommendation("childcare", "pt_fisioterapeuta")).toBe(false);
    expect(roleMatchesRecommendation("support", "unknown_role")).toBe(false);
  });
  it("adds role_differs to the review reasons", () => {
    expect(reviewDecision(scoreRisk(calm), "pt_auxiliar_saude")).toEqual({ requiresReview: false, reasons: [] });
    expect(reviewDecision(scoreRisk({ ...calm, support_type: "clinical" }), "pt_auxiliar_saude")).toEqual({
      requiresReview: true,
      reasons: ["role_differs"],
    });
  });
});
