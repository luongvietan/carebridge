import { beforeEach, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ type: "organisation", create: vi.fn(async (params: unknown) => { void params; return { url: "checkout" }; }), insert: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/require-auth", () => ({ requireAuth: async () => ({ id: "user" }) }));
vi.mock("@/lib/app-url", () => ({ getAppUrl: () => "https://example.test" }));
vi.mock("@/lib/stripe/client", () => ({ stripe: () => ({ checkout: { sessions: { create: fake.create } } }) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: fake.from }) }));
import { startCheckout } from "./actions";
beforeEach(() => {
  vi.clearAllMocks(); fake.type = "organisation";
  fake.from.mockImplementation((table: string) => {
    const result = table === "users" ? { data: { account_type: fake.type } } : table === "bookings" ? { data: { id: "booking", status: "accepted", requester_user_id: "user", total_client_charge: 100, snap_currency: "EUR", professional_roles: { name: "Nurse" } } } : { data: { id: "payment" }, count: 0 };
    const query: Record<string, unknown> = { then: (resolve: (value: unknown) => void) => resolve(result), single: async () => result, maybeSingle: async () => result };
    for (const method of ["select", "eq"]) query[method] = () => query;
    query.insert = (row: unknown) => { fake.insert(row); return query; };
    return query;
  });
});
it.each([["organisation", "organisation"], ["private_client", "client"]])("returns %s checkout to the correct booking area", async (type, area) => {
  fake.type = type;
  expect(await startCheckout("booking")).toEqual({ ok: true, url: "checkout" });
  expect(fake.create.mock.calls[0][0]).toMatchObject({ success_url: `https://example.test/${area}/bookings?paid=1`, cancel_url: `https://example.test/${area}/bookings?paid=0` });
});
it("rejects unsupported account types before financial effects", async () => {
  fake.type = "professional";
  expect(await startCheckout("booking")).toHaveProperty("error");
  expect(fake.create).not.toHaveBeenCalled(); expect(fake.insert).not.toHaveBeenCalled();
});
