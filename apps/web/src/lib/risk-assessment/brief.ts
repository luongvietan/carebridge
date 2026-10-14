import type { Answers, Text } from "./questionnaire";

/**
 * The safety and needs brief a matched professional sees: only what they need
 * to decide whether to accept and to deliver the service safely (Ana's spec,
 * section 14). It never includes safeguarding concerns, who answered, scores
 * or flags — those stay with admins.
 */
export const BRIEF_LABEL: Record<string, Text> = {
  pattern_one_off: { en: "One-off visit", pt: "Visita pontual" },
  pattern_daytime: { en: "Regular daytime support", pt: "Apoio diurno regular" },
  pattern_overnight: { en: "Regular overnight support", pt: "Apoio noturno regular" },
  pattern_live_in: { en: "Live-in or continuous support", pt: "Apoio interno ou contínuo" },
  recent_discharge: { en: "Recent hospital discharge or surgery", pt: "Alta hospitalar ou cirurgia recente" },
  hands_on_help: { en: "Regular hands-on help with daily living", pt: "Ajuda física regular nas atividades diárias" },
  two_people: { en: "Two people, specialist equipment or continuous supervision needed for some tasks", pt: "Duas pessoas, equipamento específico ou supervisão contínua em algumas tarefas" },
  falls: { en: "Falls risk", pt: "Risco de queda" },
  walking_aid: { en: "Uses a walking stick, frame or wheelchair", pt: "Utiliza bengala, andarilho ou cadeira de rodas" },
  hoist: { en: "Hoist, transfer board or specialist equipment in use", pt: "Utiliza elevador de transferência, tábua ou equipamento específico" },
  no_manual_lifting: { en: "Do not lift manually without suitable equipment", pt: "Não levantar manualmente sem equipamento adequado" },
  home_hazards: { en: "Home hazards: stairs, clutter, pets, smoking, poor lighting or limited space", pt: "Riscos na habitação: escadas, obstáculos, animais, fumo, iluminação insuficiente ou espaço reduzido" },
  medicine_reminders: { en: "Medicine reminders only", pt: "Apenas lembretes de medicação" },
  medicine_prepare: { en: "Help preparing medicines from an agreed plan", pt: "Ajuda a preparar medicamentos segundo plano definido" },
  medicine_administer: { en: "Medicine administration (nurse)", pt: "Administração de medicamentos (enfermeiro)" },
  wound_care: { en: "Wound or pressure-area care", pt: "Cuidados de ferida ou zona de pressão" },
  injection: { en: "Injection, IV therapy or blood sampling", pt: "Injeção, terapêutica intravenosa ou colheita de sangue" },
  clinical_device: { en: "Feeding tube, catheter, stoma, tracheostomy, suction or other device", pt: "Sonda, cateter, estoma, traqueostomia, aspiração ou outro dispositivo" },
  observations: { en: "Clinical observations or monitoring", pt: "Observações ou vigilância clínica" },
  swallowing: { en: "Swallowing, choking, weight or hydration concerns", pt: "Preocupações com deglutição, engasgamento, peso ou hidratação" },
  respiratory: { en: "Oxygen, ventilation or respiratory equipment", pt: "Oxigénio, ventilação ou equipamento respiratório" },
  confusion_mild: { en: "Mild memory loss or confusion", pt: "Perda de memória ou confusão ligeira" },
  confusion_severe: { en: "Moderate/severe confusion or risk of wandering", pt: "Confusão moderada/grave ou risco de deambulação" },
  distress: { en: "May show verbal distress, agitation or resistance to care", pt: "Pode apresentar angústia verbal, agitação ou resistência aos cuidados" },
  behaviour_risk: { en: "Risk of physical aggression or unpredictable behaviour", pt: "Risco de agressão física ou comportamento imprevisível" },
  mental_health: { en: "Mental-health support needs — follow CareBridge's instructions", pt: "Necessidades de apoio em saúde mental — seguir as instruções da CareBridge" },
  infection_precautions: { en: "Infection-control precautions required", pt: "Precauções de controlo de infeção necessárias" },
  allergy: { en: "Serious allergy — check the action plan", pt: "Alergia grave — consultar o plano de atuação" },
  lone_working: { en: "Lone working", pt: "Trabalho isolado" },
  lone_working_risk: { en: "Lone working with identified risks or overnight", pt: "Trabalho isolado com riscos identificados ou noturno" },
  animals: { en: "Animals in the home (secured if required)", pt: "Animais na habitação (controlados quando necessário)" },
  access_limited: { en: "Access, parking or phone signal may be limited", pt: "Acesso, estacionamento ou sinal telefónico podem ser limitados" },
  child_under_1: { en: "Child under 1 year", pt: "Criança com menos de 1 ano" },
  child_1_4: { en: "Child aged 1–4", pt: "Criança com 1–4 anos" },
  child_5_11: { en: "Child aged 5–11", pt: "Criança com 5–11 anos" },
  child_12_17: { en: "Young person aged 12–17", pt: "Jovem com 12–17 anos" },
  child_additional_needs: { en: "Child has additional needs", pt: "A criança tem necessidades adicionais" },
  child_clinical: { en: "Child needs medicines or a clinical procedure", pt: "A criança necessita de medicamentos ou procedimento clínico" },
};

/** Brief items for a set of (visible) answers, in a stable order. */
export function professionalBrief(a: Answers): string[] {
  const out: string[] = [];
  const add = (cond: boolean, code: string) => {
    if (cond) out.push(code);
  };
  add(a.B3 === "one_off", "pattern_one_off");
  add(a.B3 === "daytime", "pattern_daytime");
  add(a.B3 === "overnight", "pattern_overnight");
  add(a.B3 === "live_in", "pattern_live_in");
  add(a.B4 !== undefined && a.B4 !== "no", "recent_discharge");
  const daily = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"].map((d) => a[d]);
  add(daily.includes("3"), "two_people");
  add(!daily.includes("3") && daily.includes("2"), "hands_on_help");
  add(a.M1 === "one" || a.M1 === "recurrent", "falls");
  add(a.M2 === "aid", "walking_aid");
  add(a.M2 === "specialist", "hoist");
  add(a.M4 === "yes" || a.M4 === "not_sure", "no_manual_lifting");
  add(a.M3 === "hazards", "home_hazards");
  add(a.C1 === "reminder", "medicine_reminders");
  add(a.C1 === "prepare", "medicine_prepare");
  add(a.C1 === "administer", "medicine_administer");
  add(a.C2 === "wound", "wound_care");
  add(a.C2 === "injection", "injection");
  add(a.C2 === "device", "clinical_device");
  add(a.C3 === "routine" || a.C3 === "changing", "observations");
  add(a.C5 === "possible" || a.C5 === "confirmed", "swallowing");
  add(a.C6 === "stable" || a.C6 === "unplanned", "respiratory");
  add(a.S1 === "mild", "confusion_mild");
  add(a.S1 === "severe", "confusion_severe");
  add(a.S2 === "distress", "distress");
  add(a.S2 === "serious", "behaviour_risk");
  add(a.S3 === "stable" || a.S3 === "crisis", "mental_health");
  add(a.R1 === "precautions" || a.R1 === "unmanaged", "infection_precautions");
  add(a.R2 === "plan" || a.R2 === "unmanaged", "allergy");
  add(a.R3 === "routine", "lone_working");
  add(a.R3 === "higher_risk", "lone_working_risk");
  add(a.R4 === "secured", "animals");
  add(a.R5 === "partly" || a.R5 === "no", "access_limited");
  add(a.K1 === "under_1", "child_under_1");
  add(a.K1 === "1_4", "child_1_4");
  add(a.K1 === "5_11", "child_5_11");
  add(a.K1 === "12_17", "child_12_17");
  add(a.K2 === "stable" || a.K2 === "complex", "child_additional_needs");
  add(a.K3 === "yes", "child_clinical");
  return out;
}
