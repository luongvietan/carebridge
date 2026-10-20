import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ cookie: undefined as string | undefined, saved: "en-GB", error: null as null | { message: string }, set: vi.fn(), update: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: state.cookie }), set: state.set }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("react", async () => ({ ...await vi.importActual("react"), cache: (f: unknown) => f }));
vi.mock("@/lib/auth/require-auth", () => ({ getAuthUser: async () => ({ id: "user", user_metadata: { preferred_locale: state.saved } }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: {
  getUser: async () => ({ data: { user: { id: "user" } } }),
  updateUser: async (input: unknown) => { state.update(input); return { error: state.error }; },
} }) }));
import { getPreferredLocale } from "./preference-server";
import { setPreferredLocale } from "./preference-actions";
beforeEach(() => { state.cookie = undefined; state.saved = "en-GB"; state.error = null; state.set.mockClear(); state.update.mockClear(); });
it("reads the saved language on a different device", async () => { expect(await getPreferredLocale()).toBe("en-GB"); });
it("saves authenticated language for emails and all paths", async () => {
  expect(await setPreferredLocale("pt-PT")).toEqual({ ok: true });
  expect(state.update).toHaveBeenCalledWith({ data: { preferred_locale: "pt-PT" } });
  expect(state.set).toHaveBeenCalledWith("cbc_locale", "pt-PT", expect.objectContaining({ path: "/", httpOnly: true }));
});
it("does not claim success or change the cookie if persistence fails", async () => {
  state.error = { message: "unavailable" };
  expect(await setPreferredLocale("pt-PT")).toHaveProperty("error");
  expect(state.set).not.toHaveBeenCalled();
});
