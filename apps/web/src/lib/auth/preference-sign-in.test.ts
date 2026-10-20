import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ chosen: "en-GB", fail: false, update: vi.fn(), signOut: vi.fn(), set: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => ({ value: state.chosen }), set: state.set }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/preference-server", () => ({ getPreferredLocale: async () => state.chosen }));
vi.mock("@/lib/auth/sign-in-audit", () => ({ recordSuccessfulSignIn: vi.fn(), recordFailedSignIn: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: () => {
  const q = { select: () => q, eq: () => q, gte: async () => ({ count: 0 }) }; return q;
} }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: {
  signInWithPassword: async () => ({ data: { user: { id: "user", user_metadata: { preferred_locale: "pt-PT", market: "PT" } } } }),
  getUser: async () => ({ data: { user: { id: "user" } } }),
  updateUser: async (input: unknown) => { state.update(input); return { error: state.fail ? { message: "offline" } : null }; },
  signOut: state.signOut,
}, from: () => {
  const q = { select: () => q, eq: () => q, single: async () => ({ data: { account_type: "professional", account_status: "active" } }) }; return q;
} }) }));
import { attemptSignIn } from "./actions";
beforeEach(() => { vi.clearAllMocks(); state.chosen = "en-GB"; state.fail = false; });
it("carries the explicitly chosen language through login without changing market", async () => {
  expect(await attemptSignIn("ana@example.test", "password")).toEqual({ ok: true, redirectTo: "/professional" });
  expect(state.update).toHaveBeenCalledExactlyOnceWith({ data: { preferred_locale: "en-GB" } });
  expect(state.set).toHaveBeenCalledWith("cbc_locale", "en-GB", expect.any(Object));
});
it("does not claim a persisted language when auth persistence fails", async () => {
  state.fail = true;
  expect(await attemptSignIn("ana@example.test", "password")).toMatchObject({ ok: false });
  expect(state.signOut).toHaveBeenCalled();
  expect(state.set).not.toHaveBeenCalled();
});
