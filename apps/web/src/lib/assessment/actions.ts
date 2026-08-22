"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/auth/require-auth";
import { ensureProfessional } from "@/lib/onboarding/professional-session";
import { pickStratified } from "./selection";
import { scorePercent, isPass, nextAttemptState, planNextCycle } from "./scoring";
import { sendNotification } from "@/lib/notifications/send";
import { recomputeRoleAssignments } from "@/lib/roles/assignments";

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
  | {
      ok: true;
      attemptId: string;
      attemptNumber: number;
      questions: AssessmentQuestion[];
      roleId: string | null;
      roleName: string | null;
    }
  | { locked: true; lockUntil: string | null }
  | { error: string };

export type SubmitResult =
  | { ok: true; score: number; passed: boolean; canRetry: boolean; lockUntil: string | null }
  | { error: string };


type ResolvedRole = { roleId: string | null; roleName: string | null; lockedUntil: string | null };

/**
 * Which role's assessment is being sat, and whether it is locked.
 *
 * A professional may hold several roles and must pass each one's assessment
 * (client requirement, 22 June 2026). Assessment also comes BEFORE the profile
 * step in onboarding, so a first-time applicant legitimately has no role yet and
 * sits the common bank — that case is preserved exactly as it was.
 */
async function resolveAssessmentRole(
  admin: ReturnType<typeof createServiceClient>,
  professionalId: string,
  requestedRoleId?: string,
): Promise<ResolvedRole | { error: string }> {
  const { data: assignments } = await admin
    .from("professional_role_assignments")
    .select("professional_role_id, is_primary, assessment_locked_until, professional_roles(name)")
    .eq("professional_id", professionalId)
    .neq("status", "withdrawn")
    .order("is_primary", { ascending: false });

  const rows = assignments ?? [];
  const named = (row: (typeof rows)[number]): ResolvedRole => ({
    roleId: row.professional_role_id,
    roleName: (row.professional_roles as { name: string } | null)?.name ?? null,
    lockedUntil: row.assessment_locked_until,
  });

  if (rows.length === 0) {
    const { data: prof } = await admin
      .from("professionals")
      .select("assessment_locked_until")
      .eq("id", professionalId)
      .maybeSingle();
    return { roleId: null, roleName: null, lockedUntil: prof?.assessment_locked_until ?? null };
  }

  if (requestedRoleId) {
    const match = rows.find((r) => r.professional_role_id === requestedRoleId);
    if (!match) return { error: "You do not hold that role." };
    return named(match);
  }

  // No role named: offer the first one still to be passed, primary first.
  const { data: passed } = await admin
    .from("assessment_attempts")
    .select("professional_role_id")
    .eq("professional_id", professionalId)
    .eq("passed", true);
  const passedIds = new Set((passed ?? []).map((a) => a.professional_role_id));
  return named(rows.find((r) => !passedIds.has(r.professional_role_id)) ?? rows[0]);
}

/** Write the reapply lock for one role, mirroring it onto the profile column
 *  when that role is the primary one so the admin record keeps reading true. */
async function writeAssessmentLock(
  admin: ReturnType<typeof createServiceClient>,
  professionalId: string,
  roleId: string | null,
  lockUntil: string | null,
): Promise<void> {
  if (roleId) {
    await admin
      .from("professional_role_assignments")
      .update({ assessment_locked_until: lockUntil })
      .eq("professional_id", professionalId)
      .eq("professional_role_id", roleId);
  }

  const { data: prof } = await admin
    .from("professionals")
    .select("professional_role_id")
    .eq("id", professionalId)
    .maybeSingle();
  if (!roleId || prof?.professional_role_id === roleId) {
    await admin
      .from("professionals")
      .update({ assessment_locked_until: lockUntil })
      .eq("id", professionalId);
  }
}

const clearAssessmentLock = (
  admin: ReturnType<typeof createServiceClient>,
  professionalId: string,
  roleId: string | null,
) => writeAssessmentLock(admin, professionalId, roleId, null);

export async function startAttempt(requestedRoleId?: string): Promise<StartResult> {
  const user = await requireAuth();
  const professionalId = await ensureProfessional(user);
  if (!professionalId) return { error: "You must be signed in." };

  // Service client: question bank holds correct answers and is admin-only by RLS,
  // so selection happens server-side and correct_option is never sent to the client.
  const admin = createServiceClient();

  const { data: prof } = await admin
    .from("professionals")
    .select("professional_role_id, assessment_locked_until, country_code")
    .eq("id", professionalId)
    .single();

  // Which role is being sat for. A professional may hold several, each with its
  // own assessment: the caller names one, or we take the first that still needs
  // passing, falling back to the primary role.
  const target = await resolveAssessmentRole(admin, professionalId, requestedRoleId);
  if ("error" in target) return { error: target.error };
  const { roleId, roleName, lockedUntil } = target;

  // While the reapply lock is still in the future the applicant cannot start a
  // new attempt at THIS role. Once it elapses, planNextCycle (below) grants a
  // fresh cycle. Their other roles are unaffected.
  if (lockedUntil && new Date(lockedUntil) > new Date()) {
    return { locked: true, lockUntil: lockedUntil };
  }

  const cols = "id, topic, question_text, options";

  // Resume an in-progress attempt (started but never submitted) instead of
  // creating a new row. Otherwise an abandoned attempt would still increment the
  // attempt count and could lock the applicant out with no reapply date set.
  const inProgressQuery = admin
    .from("assessment_attempts")
    .select("id, attempt_number, served_question_ids")
    .eq("professional_id", professionalId)
    .is("completed_at", null)
    .order("attempt_number", { ascending: false })
    .limit(1);
  const { data: inProgress } = await (
    roleId
      ? inProgressQuery.eq("professional_role_id", roleId)
      : inProgressQuery.is("professional_role_id", null)
  ).maybeSingle();
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
      return {
        ok: true,
        attemptId: inProgress.id,
        attemptNumber: inProgress.attempt_number,
        questions: resumed,
        roleId,
        roleName,
      };
    }
  }

  // Plan the next attempt by reapplication cycle. Each cycle is up to
  // MAX_ATTEMPTS attempts; a fresh cycle opens only after the reapply lock has
  // elapsed (checked above), so failing 3× is a temporary lockout, not permanent.
  const completedQuery = admin
    .from("assessment_attempts")
    .select("assessment_cycle")
    .eq("professional_id", professionalId)
    .not("completed_at", "is", null);
  const { data: completed } = await (roleId
    ? completedQuery.eq("professional_role_id", roleId)
    : completedQuery.is("professional_role_id", null));
  const completedCycles = (completed ?? []).map((a) => a.assessment_cycle ?? 1);
  const { cycle, attemptNumber } = planNextCycle(completedCycles);

  // Starting a fresh cycle means a prior lock has elapsed — clear the stale
  // lock date so the admin record and the runner no longer show it as locked.
  const startingFreshCycle = attemptNumber === 1 && completedCycles.length > 0;
  if (startingFreshCycle && lockedUntil) {
    await clearAssessmentLock(admin, professionalId, roleId);
  }

  // Two pools: common questions (no role) and role-specific questions. Both are
  // scoped to the professional's country — a Portuguese applicant sits a
  // Portuguese assessment, never the English bank (0082). The MVP format draws
  // 15 from common + 5 from role-specific, each shuffled separately; a
  // role-specific shortfall tops up from common.
  const country = prof?.country_code ?? "GB";
  const { data: commonPool } = await admin
    .from("assessment_question_bank")
    .select(cols)
    .eq("is_active", true)
    .is("professional_role_id", null)
    .eq("country_code", country);
  const { data: rolePool } = roleId
    ? await admin
        .from("assessment_question_bank")
        .select(cols)
        .eq("is_active", true)
        .eq("professional_role_id", roleId)
        .eq("country_code", country)
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
    .insert({
      professional_id: professionalId,
      professional_role_id: roleId,
      assessment_cycle: cycle,
      attempt_number: attemptNumber,
      served_question_ids: servedIds,
    })
    .select("id")
    .single();
  if (error || !attempt) return { error: error?.message ?? "Could not start the assessment." };

  const questions: AssessmentQuestion[] = picked.map((p) => ({
    id: p.id,
    topic: p.topic,
    question_text: p.question_text,
    options: p.options as AssessmentOption[],
  }));
  return { ok: true, attemptId: attempt.id, attemptNumber, questions, roleId, roleName };
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
    .select("id, professional_id, professional_role_id, attempt_number, served_question_ids, completed_at")
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

  // Treat a missing correct answer (question deleted mid-attempt, or a null
  // correct_option) as INCORRECT — never let `undefined === undefined` score a
  // free mark when the served question is left blank.
  const isCorrect = (qid: string) => {
    const correct = correctById.get(qid);
    return correct != null && answers[qid] === correct;
  };
  const results = servedIds.map((qid) => isCorrect(qid));
  await admin.from("assessment_answers").insert(
    servedIds.map((qid) => ({
      attempt_id: attemptId,
      question_id: qid,
      selected_option: answers[qid] ?? null,
      is_correct: isCorrect(qid),
    })),
  );

  const score = scorePercent(results);
  const passed = isPass(score);
  await admin
    .from("assessment_attempts")
    .update({ score, passed, completed_at: new Date().toISOString() })
    .eq("id", attemptId);

  // The lock belongs to the role that was sat, not to the person: failing the
  // childminder assessment three times must not stop a nurse nursing.
  const state = nextAttemptState(attempt.attempt_number, passed);
  if (state.lockUntil) {
    await writeAssessmentLock(
      admin,
      professionalId,
      attempt.professional_role_id,
      state.lockUntil.toISOString().slice(0, 10),
    );
  }

  // Passing may be the last thing this role was waiting for.
  if (passed) {
    await recomputeRoleAssignments(admin, professionalId);
  }

  // Spec §16 audit trail: record assessment completion + score. Best-effort —
  // an audit failure must not block the applicant's result.
  await admin.from("audit_log").insert({
    actor_user_id: user.id,
    actor_type: "user",
    action: "assessment.completed",
    entity_type: "assessment_attempt",
    entity_id: attemptId,
    summary: `score=${score}%, passed=${passed ? "yes" : "no"}, attempt=${attempt.attempt_number}`,
  });

  const { data: profRow } = await admin
    .from("professionals")
    .select("user_id")
    .eq("id", professionalId)
    .single();
  if (profRow?.user_id) {
    await sendNotification("assessment_result", profRow.user_id, {
      score,
      passed: passed ? "Passed" : "Not passed",
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
