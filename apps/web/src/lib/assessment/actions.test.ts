import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ writes: vi.fn(), role: null as string | null }));
vi.mock("@/lib/auth/require-auth", () => ({ requireAuth: async () => ({ id: "user" }) }));
vi.mock("@/lib/accounts/market-server", () => ({ getAccountCountry: async () => "PT" }));
vi.mock("@/lib/onboarding/professional-session", () => ({ ensureProfessional: async () => "pro" }));
vi.mock("@/lib/notifications/send", () => ({ sendNotification: vi.fn() }));
vi.mock("@/lib/roles/assignments", () => ({ recomputeRoleAssignments: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (table: string) => {
  const data = table === "assessment_attempts"
    ? { id: "attempt", professional_id: "pro", professional_role_id: "nurse", completed_at: null, served_question_ids: Array.from({ length: 20 }, (_, i) => `q${i}`) }
    : Array.from({ length: 20 }, (_, i) => ({ id: `q${i}`, correct_option: "a", country_code: "PT", professional_role_id: state.role }));
  const query = {
    select: () => query, eq: () => query, in: () => query,
    single: async () => ({ data }),
    then: (resolve: (value: unknown) => void) => resolve({ data }),
    insert: state.writes, update: state.writes,
  };
  return query;
} }) }));

import { submitAttempt } from "./actions";
beforeEach(() => { state.writes.mockClear(); state.role = null; });
it("cannot submit a previously served common-only PT role assessment", async () => {
  const answers = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`q${i}`, "a"]));
  expect(await submitAttempt("attempt", answers)).toEqual({ error: expect.stringContaining("preparação") });
  expect(state.writes).not.toHaveBeenCalled();
});
it("cannot submit a PT assessment made entirely of another role's questions", async () => {
  state.role = "physio";
  expect(await submitAttempt("attempt", {})).toEqual({ error: expect.stringContaining("preparação") });
  expect(state.writes).not.toHaveBeenCalled();
});
