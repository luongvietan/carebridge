import { beforeEach, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
const fake = vi.hoisted(() => ({ existing: null as null | { id: string }, snapshot: "PT" as string | null, insert: vi.fn(), selected: vi.fn(async () => "GB") }));
vi.mock("@/lib/marketing/market-server", () => ({ getSelectedCountry: fake.selected }));
vi.mock("@/lib/auth/require-auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "users" ? { account_type: "professional", country_code: fake.snapshot } : null }) }) }) }) }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({
  select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fake.existing }) }) }),
  insert: (row: unknown) => { fake.insert(row); return { select: () => ({ single: async () => ({ data: { id: "new" } }) }) }; },
}) }) }));
import { ensureProfessional } from "./professional-session";
beforeEach(() => { fake.existing = null; fake.snapshot = "PT"; vi.clearAllMocks(); });
it("persists the PT signup market even after the visitor changes cookie to GB", async () => {
  await ensureProfessional({ id: "user", user_metadata: { market: "PT" } } as unknown as User);
  expect(fake.insert.mock.calls[0][0]).toMatchObject({ country_code: "PT" });
  expect(fake.selected).not.toHaveBeenCalled();
});
it("preserves existing professional instead of recreating it", async () => {
  fake.existing = { id: "existing" };
  expect(await ensureProfessional({ id: "user", user_metadata: { market: "PT" } } as unknown as User)).toBe("existing");
  expect(fake.insert).not.toHaveBeenCalled();
});
it("uses GB deliberately for legacy signup without a country snapshot", async () => {
  fake.snapshot = null;
  await ensureProfessional({ id: "user", user_metadata: {} } as unknown as User);
  expect(fake.insert.mock.calls[0][0]).toMatchObject({ country_code: "GB" });
});
it("ignores changed auth metadata while creating the professional from its immutable PT snapshot", async () => {
  await ensureProfessional({ id: "user", user_metadata: { market: "GB" } } as unknown as User);
  expect(fake.insert.mock.calls[0][0]).toMatchObject({ country_code: "PT" });
});
