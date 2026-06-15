"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { ensureProfessional } from "@/lib/onboarding/actions";
import { pickQuestions } from "./selection";
import { scorePercent, isPass, nextAttemptState, MAX_ATTEMPTS } from "./scoring";
import { sendNotification } from "@/lib/notifications/send";

const QUESTIONS_PER_ATTEMPT = 8;

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
  const professionalId = await ensureProfessional();
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

  const { count } = await admin
    .from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId);
  const attemptNumber = (count ?? 0) + 1;
  if (attemptNumber > MAX_ATTEMPTS) {
    return { locked: true, lockUntil: prof?.assessment_locked_until ?? null };
  }

  let query = admin
    .from("assessment_question_bank")
    .select("id, topic, question_text, options")
    .eq("is_active", true);
  const roleId = prof?.professional_role_id ?? null;
  query = roleId
    ? query.or(`professional_role_id.is.null,professional_role_id.eq.${roleId}`)
    : query.is("professional_role_id", null);

  const { data: pool } = await query;
  if (!pool || pool.length === 0) return { error: "No assessment questions are available yet." };

  const picked = pickQuestions(pool, QUESTIONS_PER_ATTEMPT);
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
  const professionalId = await ensureProfessional();
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
