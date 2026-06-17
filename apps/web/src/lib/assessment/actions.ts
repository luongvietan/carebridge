"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { pickStratified } from "./selection";
import { scorePercent, isPass, nextAttemptState, MAX_ATTEMPTS } from "./scoring";
import { sendNotification } from "@/lib/notifications/send";

// CareBridge MVP assessment format: 15 common + 5 role-specific = 20 questions.
const COMMON_PER_ATTEMPT = 15;
const ROLE_SPECIFIC_PER_ATTEMPT = 5;

export type AssessmentOption = { key: string; text: string };
export type AssessmentQuestion = {
  id: string;
  topic: string;
  question_text: string;
  options: AssessmentOption[];
};

export type StartResult =
  | { ok: true; attemptId: string; attemptNumber: number; questions: AssessmentQuestion[] }
  | { locked: true; lockUntil: string | null }
  | { error: string };

export type SubmitResult =
  | { ok: true; score: number; passed: boolean; canRetry: boolean; lockUntil: string | null }
  | { error: string };

export async function startAttempt(): Promise<StartResult> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  // Service client: question bank holds correct answers and is admin-only by RLS,
  // so selection happens server-side and correct_option is never sent to the client.
  const admin = createServiceClient();

  const { data: prof } = await admin
    .from("professionals")
    .select("professional_role_id, assessment_locked_until")
    .eq("id", professionalId)
    .single();

  if (prof?.assessment_locked_until && new Date(prof.assessment_locked_until) > new Date()) {
    return { locked: true, lockUntil: prof.assessment_locked_until };
  }

  const cols = "id, topic, question_text, options";
  const roleId = prof?.professional_role_id ?? null;

  // Resume an in-progress attempt (started but never submitted) instead of
  // creating a new row. Otherwise an abandoned attempt would still increment the
  // attempt count and could lock the applicant out with no reapply date set.
  const { data: inProgress } = await admin
    .from("assessment_attempts")
    .select("id, attempt_number, served_question_ids")
    .eq("professional_id", professionalId)
    .is("completed_at", null)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (inProgress) {
    const servedIds = (inProgress.served_question_ids as string[]) ?? [];
    const { data: qs } = await admin.from("assessment_question_bank").select(cols).in("id", servedIds);
    const byId = new Map((qs ?? []).map((q) => [q.id, q]));
    const resumed = servedIds
      .map((qid) => byId.get(qid))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map((q) => ({
        id: q.id,
        topic: q.topic,
        question_text: q.question_text,
        options: q.options as AssessmentOption[],
      }));
    if (resumed.length > 0) {
      return { ok: true, attemptId: inProgress.id, attemptNumber: inProgress.attempt_number, questions: resumed };
    }
  }

  // Count only COMPLETED attempts toward the limit.
  const { count } = await admin
    .from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .not("completed_at", "is", null);
  const attemptNumber = (count ?? 0) + 1;
  if (attemptNumber > MAX_ATTEMPTS) {
    return { locked: true, lockUntil: prof?.assessment_locked_until ?? null };
  }

  // Two pools: common questions (no role) and role-specific questions. The MVP
  // format draws 15 from common + 5 from role-specific, each shuffled separately.
  const { data: commonPool } = await admin
    .from("assessment_question_bank")
    .select(cols)
    .eq("is_active", true)
    .is("professional_role_id", null);
  const { data: rolePool } = roleId
    ? await admin
        .from("assessment_question_bank")
        .select(cols)
        .eq("is_active", true)
        .eq("professional_role_id", roleId)
    : { data: [] };

  const picked = pickStratified(
    commonPool ?? [],
    rolePool ?? [],
    COMMON_PER_ATTEMPT,
    ROLE_SPECIFIC_PER_ATTEMPT,
  );
  if (picked.length === 0) return { error: "No assessment questions are available yet." };
  const servedIds = picked.map((p) => p.id);

  const { data: attempt, error } = await admin
    .from("assessment_attempts")
    .insert({ professional_id: professionalId, attempt_number: attemptNumber, served_question_ids: servedIds })
    .select("id")
    .single();
  if (error || !attempt) return { error: error?.message ?? "Could not start the assessment." };

  const questions: AssessmentQuestion[] = picked.map((p) => ({
    id: p.id,
    topic: p.topic,
    question_text: p.question_text,
    options: p.options as AssessmentOption[],
  }));
  return { ok: true, attemptId: attempt.id, attemptNumber, questions };
}

export async function submitAttempt(
  attemptId: string,
  answers: Record<string, string>,
): Promise<SubmitResult> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  const admin = createServiceClient();

  const { data: attempt } = await admin
    .from("assessment_attempts")
    .select("id, professional_id, attempt_number, served_question_ids, completed_at")
    .eq("id", attemptId)
    .single();
  if (!attempt || attempt.professional_id !== professionalId) return { error: "Attempt not found." };
  if (attempt.completed_at) return { error: "This attempt was already submitted." };

  const servedIds = (attempt.served_question_ids as string[]) ?? [];
  const { data: questions } = await admin
    .from("assessment_question_bank")
    .select("id, correct_option")
    .in("id", servedIds);
  const correctById = new Map((questions ?? []).map((q) => [q.id, q.correct_option]));

  const results = servedIds.map((qid) => answers[qid] === correctById.get(qid));
  await admin.from("assessment_answers").insert(
    servedIds.map((qid) => ({
      attempt_id: attemptId,
      question_id: qid,
      selected_option: answers[qid] ?? null,
      is_correct: answers[qid] === correctById.get(qid),
    })),
  );

  const score = scorePercent(results);
  const passed = isPass(score);
  await admin
    .from("assessment_attempts")
    .update({ score, passed, completed_at: new Date().toISOString() })
    .eq("id", attemptId);

  const state = nextAttemptState(attempt.attempt_number, passed);
  if (state.lockUntil) {
    await admin
      .from("professionals")
      .update({ assessment_locked_until: state.lockUntil.toISOString().slice(0, 10) })
      .eq("id", professionalId);
  }

  const { data: profRow } = await admin
    .from("professionals")
    .select("user_id")
    .eq("id", professionalId)
    .single();
  if (profRow?.user_id) {
    await sendNotification("assessment_result", profRow.user_id, {
      score,
      passed: passed ? "yes" : "no",
      attempt_number: attempt.attempt_number,
    });
  }

  return {
    ok: true,
    score,
    passed,
    canRetry: state.canRetry,
    lockUntil: state.lockUntil ? state.lockUntil.toISOString() : null,
  };
}
