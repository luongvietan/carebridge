import { describe, expect, it } from "vitest";
import { EMERGENCY_QUESTIONS, FLAGS, QUESTIONNAIRE_VERSION } from "./questionnaire";
import {
  assessRisk,
  reviewDecision,
  roleAllowed,
  roleMatchesRecommendation,
  validateSubmission,
  visibleAnswers,
  visibleQuestions,
  withRespondent,
  type RiskSubmission,
} from "./score";
import { professionalBrief } from "./brief";

/** An adult, family-completed, low-need request: green, standard support. */
const calm: Record<string, string> = {
  A2: "yes", A3: "independently", A4: "yes",
  B1: "adult", B2: "companionship", B3: "daytime", B4: "no",
  D1: "0", D2: "0", D3: "0", D4: "0", D5: "0", D6: "0", D7: "0", D8: "0",
  M1: "no", M2: "no", M3: "none",
  C1: "no", C4: "no", C5: "no", C6: "no",
  S1: "no", S2: "no", S3: "no", S4: "no", S5: "no",
  R1: "no", R2: "no", R3: "no", R4: "no", R5: "yes",
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
const assess = (over: Record<string, string>, respondent: RiskSubmission["respondent"] = "family") =>
  assessRisk(respondent, { ...calm, ...over });

describe("validateSubmission", () => {
  it("accepts a complete, consented submission", () => {
    expect(validateSubmission(submission())).toBeNull();
  });

  it.each(EMERGENCY_QUESTIONS.map((q) => q.id))("stops on emergency answer %s", (id) => {
    expect(validateSubmission(submission({ emergency: { ...noEmergency, [id]: true } }))).toBe("emergency");
  });

  it("refuses missing answers, unanswered emergencies, no consent and an old version", () => {
    const partial = { ...calm };
    delete partial.R3;
    expect(validateSubmission(submission({ answers: partial }))).toBe("unanswered");
    expect(validateSubmission(submission({ answers: { ...calm, R3: "made_up" } }))).toBe("unanswered");
    expect(validateSubmission(submission({ emergency: { ...noEmergency, E5: undefined as unknown as boolean } }))).toBe("unanswered");
    expect(validateSubmission(submission({ consent: false }))).toBe("consent");
    expect(validateSubmission(submission({ version: "2026-10-14-draft" }))).toBe("outdated");
  });

  it("requires a follow-up once it becomes relevant (M4 after help moving)", () => {
    expect(validateSubmission(submission({ answers: { ...calm, D1: "2" } }))).toBe("unanswered");
    expect(validateSubmission(submission({ answers: { ...calm, D1: "2", M4: "no" } }))).toBeNull();
  });
});

describe("conditional questions", () => {
  const ids = (a: Record<string, string>, respondent = "family") => visibleQuestions(withRespondent(respondent, a)).map((q) => q.id);

  it("shows the child branch only for children", () => {
    expect(ids(calm)).not.toContain("K1");
    const child = ids({ B1: "child" });
    expect(child).toEqual(expect.arrayContaining(["K1", "K2", "K3", "K4"]));
    expect(child).not.toContain("D1");
    expect(child).not.toContain("C1");
  });

  it("shows clinical follow-ups only when relevant", () => {
    expect(ids(calm)).not.toContain("C2");
    expect(ids({ ...calm, B2: "nursing" })).toEqual(expect.arrayContaining(["C2", "C3"]));
    expect(ids({ ...calm, B4: "with_plan" })).toContain("C2");
    expect(ids({ ...calm, C1: "administer" })).toContain("C3");
  });

  it("skips authority questions when the person completes it themselves", () => {
    expect(ids(calm, "self")).not.toContain("A2");
    expect(ids(calm, "family")).toContain("A2");
  });

  it("stores only the answers to questions that were shown", () => {
    const stored = visibleAnswers("family", { ...calm, K1: "1_4", C2: "wound" });
    expect(stored.K1).toBeUndefined();
    expect(stored.C2).toBeUndefined();
  });
});

describe("assessRisk — bands and outcomes", () => {
  it("routes a calm adult request green, standard support", () => {
    expect(assessRisk("family", calm)).toMatchObject({ score: 0, band: "green", outcome: "G", flags: [], recommendedFamily: "support" });
  });

  it("recommends a physiotherapist for rehabilitation (P)", () => {
    expect(assess({ B2: "rehab" })).toMatchObject({ outcome: "P", band: "green", recommendedFamily: "physio" });
  });

  it("keeps a score of 7 green and makes 8 amber", () => {
    const seven = assess({ D1: "2", D2: "2", D3: "2", D4: "1", M4: "no" });
    expect(seven).toMatchObject({ score: 7, band: "green", outcome: "G" });
    const eight = assess({ D1: "2", D2: "2", D3: "2", D4: "1", D5: "1", M4: "no" });
    expect(eight).toMatchObject({ score: 8, band: "amber", outcome: "A" });
    expect(eight.flags).toContain("score_amber");
  });

  it("keeps 15 amber and makes 16 red", () => {
    const base = { D1: "2", D2: "2", D3: "2", D4: "2", D5: "2", D6: "2", D7: "2", M4: "no" };
    expect(assess({ ...base, D8: "1" })).toMatchObject({ score: 15, band: "amber" });
    const sixteen = assess({ ...base, D8: "2" });
    expect(sixteen).toMatchObject({ score: 16, band: "red", outcome: "A" });
    expect(sixteen.flags).toContain("score_red");
  });

  it("lets rules override a low total", () => {
    const r = assess({ C2: "wound", B4: "with_plan" });
    expect(r.score).toBe(0);
    expect(r).toMatchObject({ band: "red", outcome: "N", recommendedFamily: "nurse_adult" });
  });
});

describe("hard override rules (section 13)", () => {
  it.each([
    [{ C1: "administer" }, "medicine_administration"],
    [{ B2: "nursing", C2: "injection", C3: "no" }, "nursing_procedure"],
    [{ B2: "nursing", C2: "device", C3: "no" }, "nursing_procedure"],
    [{ B2: "nursing", C2: "none", C3: "changing" }, "clinical_monitoring"],
    [{ C4: "yes" }, "unstable_condition"],
    [{ B4: "without_plan", C2: "none", C3: "no" }, "discharge_without_plan"],
    [{ C6: "stable" }, "respiratory_equipment"],
    [{ C5: "confirmed" }, "swallowing_risk"],
  ])("routes %o to nursing (N)", (over, flag) => {
    const r = assess(over);
    expect(r.flags).toContain(flag);
    expect(r.outcome).toBe("N");
    expect(r.band).toBe("red");
  });

  it.each([
    [{ D2: "3", M4: "no" }, "manual_handling"],
    [{ M2: "specialist", M4: "no" }, "manual_handling"],
    [{ S4: "known" }, "safeguarding_known"],
    [{ S4: "possible" }, "safeguarding_possible"],
    [{ S2: "serious" }, "behaviour_risk"],
    [{ S3: "crisis" }, "mental_health_crisis"],
    [{ S5: "yes" }, "vulnerable_person"],
    [{ A2: "no" }, "authority_unclear"],
    [{ A4: "no" }, "agreement_unclear"],
    [{ M1: "recurrent" }, "falls_risk"],
    [{ M3: "hazards" }, "home_hazards"],
    [{ D1: "1", M4: "yes" }, "manual_lifting"],
    [{ R1: "unmanaged" }, "infection_unmanaged"],
    [{ R2: "unmanaged" }, "allergy_unmanaged"],
    [{ R3: "higher_risk" }, "lone_working_risk"],
    [{ R5: "no" }, "access_unsafe"],
    [{ S1: "severe" }, "cognition_risk"],
    [{ B4: "with_plan", C2: "none", C3: "no" }, "recent_discharge"],
  ])("holds %o for review", (over, flag) => {
    const r = assess(over);
    expect(r.flags).toContain(flag);
    expect(r.outcome).toBe("A");
    expect(r.band).not.toBe("green");
  });

  it.each([
    [{ M3: "serious" }, "serious_danger"],
    [{ R4: "aggressive" }, "aggressive_animal"],
  ])("marks %o as possibly outside scope (X)", (over, flag) => {
    const r = assess(over);
    expect(r.flags).toContain(flag);
    expect(r).toMatchObject({ outcome: "X", band: "red" });
  });

  it("recommends a mental health nurse after a recent crisis", () => {
    expect(assess({ S3: "crisis" }).recommendedFamily).toBe("nurse_mental_health");
  });
});

describe("important 'Not sure' answers trigger review", () => {
  it.each([
    [{ A2: "not_sure" }, "authority_unclear"],
    [{ A3: "not_known" }, "capacity_unknown"],
    [{ A4: "not_sure" }, "agreement_unclear"],
    [{ C4: "not_sure" }, "clinical_need_unclear"],
    [{ D1: "1", M4: "not_sure" }, "manual_lifting"],
  ])("%o", (over, flag) => {
    const r = assess(over);
    expect(r.flags).toContain(flag);
    expect(r.outcome).not.toBe("G");
  });

  it("flags several minor 'Not sure' answers together", () => {
    expect(assess({ B3: "not_sure" }).flags).toEqual([]);
    expect(assess({ B3: "not_sure", R5: "no" }).flags).toContain("important_not_sure");
  });
});

describe("children", () => {
  const child = { A2: "yes", A3: "with_support", A4: "representative", B1: "child", B2: "childcare", B3: "daytime", B4: "no",
    M3: "none", S2: "no", S4: "no", R1: "no", R2: "no", R3: "no", R4: "no", R5: "yes", K1: "5_11", K2: "no", K3: "no", K4: "parent" };

  it("always holds childcare for authority and safeguarding checks", () => {
    const r = assessRisk("family", child);
    expect(r).toMatchObject({ outcome: "A", recommendedFamily: "childcare" });
    expect(r.flags).toEqual(["child_involved"]);
  });

  it("routes a child's clinical procedure to a children's nurse", () => {
    expect(assessRisk("family", { ...child, K3: "yes" })).toMatchObject({ outcome: "N", recommendedFamily: "nurse_child" });
  });

  it("holds unclear parental authority and complex needs", () => {
    expect(assessRisk("family", { ...child, K4: "not_clear" }).flags).toContain("authority_unclear");
    expect(assessRisk("family", { ...child, K2: "complex" }).flags).toContain("child_complex_needs");
  });

  it("treats childcare for an adult as inconsistent", () => {
    expect(assess({ B2: "childcare" }).flags).toContain("childcare_for_adult");
  });
});

describe("role restrictions", () => {
  it("only allows a nurse for a nursing outcome — the client cannot override it", () => {
    const nursing = assess({ C1: "administer" });
    expect(roleAllowed(nursing, "pt_auxiliar_saude")).toBe(false);
    expect(roleAllowed(nursing, "pt_enfermeiro_adulto")).toBe(true);
    expect(roleAllowed(assessRisk("family", calm), "pt_auxiliar_saude")).toBe(true);
  });

  it("accepts the recommended family and a nurse where support would do", () => {
    expect(roleMatchesRecommendation("support", "pt_auxiliar_saude")).toBe(true);
    expect(roleMatchesRecommendation("support", "pt_enfermeiro_adulto")).toBe(true);
    expect(roleMatchesRecommendation("physio", "pt_auxiliar_saude")).toBe(false);
    expect(roleMatchesRecommendation("support", "unknown_role")).toBe(false);
  });

  it("publishes only green requests booked with a matching role", () => {
    expect(reviewDecision(assessRisk("family", calm), "pt_auxiliar_saude")).toEqual({ requiresReview: false, flags: [] });
    expect(reviewDecision(assessRisk("family", calm), "pt_fisioterapeuta")).toEqual({ requiresReview: true, flags: ["role_differs"] });
    expect(reviewDecision(assess({ M3: "hazards" }), "pt_auxiliar_saude").requiresReview).toBe(true);
  });

  it("labels every flag the rules can raise", () => {
    const raised = [
      assess({ C1: "administer", S4: "known", M3: "serious", R4: "aggressive", B2: "childcare" }),
      assess({ B3: "not_sure", R5: "no", D1: "2", D2: "2", D3: "2", D4: "2", D5: "2", D6: "2", D7: "2", D8: "2", M4: "no" }),
    ].flatMap((r) => r.flags);
    for (const flag of [...raised, "role_differs"]) expect(FLAGS[flag], flag).toBeDefined();
  });
});

describe("professional brief", () => {
  it("contains only practical safety and needs items — never safeguarding", () => {
    const brief = professionalBrief({ ...calm, D2: "3", M2: "specialist", M4: "yes", R4: "secured", S4: "known", R3: "higher_risk" });
    expect(brief).toEqual(expect.arrayContaining(["two_people", "hoist", "no_manual_lifting", "animals", "lone_working_risk"]));
    expect(brief.join(" ")).not.toMatch(/safeguard/);
  });
});
