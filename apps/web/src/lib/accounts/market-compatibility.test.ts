import { beforeEach, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const fake = vi.hoisted(() => ({
  snapshotError: { code: "42703", message: "column users.country_code does not exist" } as { code: string; message: string } | null,
  retryError: null as { code: string; message: string } | null,
  profileError: null as { code: string; message: string } | null,
  type: "professional", profileCountry: "PT", snapshot: "GB", queries: [] as string[], selected: vi.fn(async () => "PT"),
}));
vi.mock("@/lib/auth/require-auth", () => ({ getAuthUser: async () => null }));
vi.mock("@/lib/marketing/market-server", () => ({ getSelectedCountry: fake.selected }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (table: string) => {
  let fields = "";
  const query = {
    select: (value: string) => { fields = value; fake.queries.push(`${table}:${value}`); return query; },
    eq: () => query,
    maybeSingle: async () => table !== "users" ? { data: { country_code: fake.profileCountry }, error: fake.profileError }
      : fields === "account_type" ? { data: { account_type: fake.type }, error: fake.retryError }
      : { data: fake.snapshotError ? null : { account_type: fake.type, country_code: fake.snapshot }, error: fake.snapshotError },
  };
  return query;
} }) }));
import { getAccountCountry } from "./market-server";
const user: User = { id: "user", user_metadata: { market: "PT" }, app_metadata: {}, aud: "authenticated", created_at: "2026-10-01T00:00:00Z" };
beforeEach(() => {
  fake.snapshotError = { code: "42703", message: "column users.country_code does not exist" };
  fake.retryError = null; fake.profileError = null; fake.type = "professional"; fake.profileCountry = "PT"; fake.snapshot = "GB"; fake.queries = []; vi.clearAllMocks();
});

it("uses a persisted PT professional profile on the pre-0091 schema", async () => {
  expect(await getAccountCountry(user)).toBe("PT");
  expect(fake.queries).toEqual(["users:account_type, country_code", "users:account_type", "professionals:country_code"]);
  expect(fake.selected).not.toHaveBeenCalled();
});
it("uses a persisted GB organisation profile on the pre-0091 schema", async () => {
  fake.type = "organisation"; fake.profileCountry = "GB";
  expect(await getAccountCountry(user)).toBe("GB");
  expect(fake.queries.at(-1)).toBe("organisations:country_code");
});
it("uses legacy GB for private clients without reading mutable metadata or visitor cookie", async () => {
  fake.type = "private_client";
  expect(await getAccountCountry(user)).toBe("GB");
  expect(fake.queries).toHaveLength(2); expect(fake.selected).not.toHaveBeenCalled();
});
it("also recognizes the exact users.country_code PostgREST schema-cache error", async () => {
  fake.snapshotError = { code: "PGRST204", message: "Could not find the 'country_code' column of 'users' in the schema cache" };
  expect(await getAccountCountry(user)).toBe("PT");
});
it("preserves the signup snapshot when the column is available", async () => {
  fake.snapshotError = null;
  expect(await getAccountCountry(user)).toBe("GB");
  expect(fake.queries).toEqual(["users:account_type, country_code"]);
});
it.each([
  { code: "42501", message: "permission denied for users" },
  { code: "42703", message: "column users.account_type does not exist" },
  { code: "PGRST204", message: "Could not find the 'country_code' column of 'organisations' in the schema cache" },
])("rejects unrelated snapshot errors without retrying: $code / $message", async (error) => {
  fake.snapshotError = error;
  await expect(getAccountCountry(user)).rejects.toThrow("Could not determine account country.");
  expect(fake.queries).toHaveLength(1);
});
it("rejects a failed compatibility retry", async () => {
  fake.retryError = { code: "42501", message: "permission denied" };
  await expect(getAccountCountry(user)).rejects.toThrow("Could not determine account country.");
  expect(fake.queries).toHaveLength(2);
});
it("keeps profile read failures closed after a successful compatibility retry", async () => {
  fake.profileError = { code: "08006", message: "connection failure" };
  await expect(getAccountCountry(user)).rejects.toThrow("Could not determine account country.");
});
