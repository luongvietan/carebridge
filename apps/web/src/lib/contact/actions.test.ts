import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitContactMessage } from "./actions";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/email/transport", () => ({ sendEmail: mocks.send }));
vi.mock("@/lib/marketing/market-server", () => ({ getSelectedCountry: async () => "PT" }));
vi.mock("@/lib/i18n/preference-server", () => ({ getPreferredLocale: async () => "pt-PT" }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ rpc: mocks.rpc, from: () => {
  const chain = { select: () => chain, eq: () => chain, gte: () => chain, order: () => chain, limit: async () => ({ data: [], error: null }), insert: async () => ({ error: null }) };
  return chain;
} }) }));

function form(extra = {}) {
  const data = new FormData();
  for (const [k, v] of Object.entries({ name: "Jo", email: "jo@example.test", message: "private health detail", ...extra })) data.set(k, v);
  return data;
}
describe("contact acknowledgement", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ data: "saved", error: null }); mocks.send.mockResolvedValue("sent");
  });
  it("saves first and acknowledges without echoing the submitted message", async () => {
    expect(await submitContactMessage(null, form())).toMatchObject({ ok: true, acknowledgement: "sent", locale: "pt-PT" });
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.send.mock.invocationCallOrder[0]);
    expect(mocks.rpc).toHaveBeenCalledWith("submit_contact_enquiry", expect.objectContaining({ p_email: "jo@example.test", p_message: "private health detail" }));
    expect(mocks.send.mock.calls[0][0].html).not.toContain("private health detail");
  });
  it("retains saved success when email fails", async () => {
    mocks.send.mockRejectedValue(new Error("offline"));
    expect(await submitContactMessage(null, form())).toMatchObject({ ok: true, acknowledgement: "failed" });
  });
  it("does not email or save a honeypot submission", async () => {
    expect(await submitContactMessage(null, form({ website: "spam" }))).toHaveProperty("error");
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it("does not resend or reinsert a recent duplicate", async () => {
    mocks.rpc.mockResolvedValue({ data: "duplicate", error: null });
    expect(await submitContactMessage(null, form())).toMatchObject({ ok: true, acknowledgement: "duplicate" });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects bursts and database failures without sending", async () => {
    mocks.rpc.mockResolvedValue({ data: "throttled", error: null });
    expect(await submitContactMessage(null, form())).toHaveProperty("error");
    mocks.rpc.mockResolvedValue({ error: { message: "down" } });
    expect(await submitContactMessage(null, form())).toHaveProperty("error");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
