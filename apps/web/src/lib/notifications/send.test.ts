import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderTemplate, sendNotification } from "./send";
const state = vi.hoisted(() => ({ locale: undefined as string | undefined, country: "PT", missing: false, missingTemplate: false, updates: vi.fn(), chosen: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (table: string) => {
  let locale = "";
  const q = {
    select: () => q,
    eq: (key: string, value: string) => { if (key === "locale") { locale = value; state.chosen(value); } return q; },
    insert: () => q,
    update: (value: unknown) => { state.updates(value); return q; },
    single: async () => result(), maybeSingle: async () => result(),
    then: (resolve: (v: unknown) => void) => resolve({ error: null }),
  };
  function result() {
    if (table === "users") return { data: state.missing ? null : { email: "a@example.test", country_code: state.country, preferred_locale: state.locale } };
    if (table === "notifications") return { data: { id: "notice" } };
    return { data: state.missingTemplate && locale === "pt-PT" ? null : { subject: locale === "pt-PT" ? "Olá {{name}}" : "Hello {{name}}", body: "Booking {{id}}" } };
  }
  return q;
} }) }));
beforeEach(() => { vi.clearAllMocks(); state.locale = undefined; state.country = "PT"; state.missing = false; state.missingTemplate = false; });
describe("notification language and delivery", () => {
  it("substitutes variables and clears absent ones", () => {
    expect(renderTemplate({ subject: "{{name}}", body: "{{id}} {{missing}}" }, { name: "Ana", id: 3 })).toEqual({ subject: "Ana", body: "3 " });
  });
  it.each(["PT", "GB"])("uses saved English independently of %s market", async (country) => {
    state.country = country; state.locale = "en-GB";
    const sender = vi.fn();
    await sendNotification("booking_confirmation", "user", { name: "Ana", id: "b1" }, sender);
    expect(state.chosen).toHaveBeenCalledExactlyOnceWith("en-GB");
    expect(sender).toHaveBeenCalledWith(expect.objectContaining({ subject: "Hello Ana", html: expect.stringContaining('lang="en-GB"') }));
    expect(state.updates).toHaveBeenCalledWith(expect.objectContaining({ status: "sent" }));
  });
  it.each([undefined, "pt-PT"])("uses Portuguese by default or explicit preference: %s", async (locale) => {
    state.locale = locale; state.country = "GB";
    const sender = vi.fn();
    await sendNotification("booking_confirmation", "user", { name: "Ana" }, sender);
    expect(state.chosen).toHaveBeenCalledExactlyOnceWith("pt-PT");
    expect(sender).toHaveBeenCalledWith(expect.objectContaining({ subject: "Olá Ana" }));
  });
  it("falls back to an English template when the translation is missing", async () => {
    state.missingTemplate = true;
    const sender = vi.fn();
    await sendNotification("booking_confirmation", "user", { name: "Ana" }, sender);
    expect(state.chosen.mock.calls).toEqual([["pt-PT"], ["en-GB"]]);
    expect(sender).toHaveBeenCalledWith(expect.objectContaining({ subject: "Hello Ana" }));
  });
  it("records a missing recipient or delivery failure without throwing", async () => {
    state.missing = true;
    const sender = vi.fn();
    await sendNotification("booking_confirmation", "user", {}, sender);
    expect(sender).not.toHaveBeenCalled();
    expect(state.updates).toHaveBeenCalledWith({ status: "failed" });
    state.missing = false;
    await sendNotification("booking_confirmation", "user", {}, vi.fn().mockRejectedValue(new Error("offline")));
    expect(state.updates).toHaveBeenLastCalledWith({ status: "failed" });
  });
  it("keeps skipped delivery queued", async () => {
    await sendNotification("booking_confirmation", "user", {}, vi.fn().mockResolvedValue("skipped"));
    expect(state.updates).not.toHaveBeenCalled();
  });
});
