import { beforeEach, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ locale: undefined as string | undefined, cookie: undefined as string | undefined, country: null as string | null, snapshot: "PT" as string | null, type: "professional", metadata: "PT", readError: false, upsert: vi.fn(), selected: vi.fn(async () => "GB") }));
vi.mock("@/lib/marketing/market-server", () => ({ getSelectedCountry: fake.selected }));
vi.mock("@/lib/stripe/client", () => ({ createCustomer: async () => ({ id: "customer" }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "user", user_metadata: { market: fake.metadata } } } }) } }) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (table: string) => {
  const data = table === "users" ? { account_type: fake.type, country_code: fake.snapshot } : fake.country ? { country_code: fake.country, stripe_customer_id: "customer" } : null;
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data, error: fake.readError ? { message: "unavailable" } : null }), upsert: async (row: unknown) => { fake.upsert(row); return { error: null }; } };
  return query;
} }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: fake.cookie }) }) }));
vi.mock("@/lib/auth/require-auth", () => ({ getAuthUser: async () => ({ id: "user", user_metadata: { market: fake.metadata, preferred_locale: fake.locale } }), requireAuth: async () => ({ id: "user", user_metadata: { market: fake.metadata } }) }));
import { getAccountCountry } from "./market-server";
import { getPortalLocale } from "@/lib/i18n/portal-server";
import { getOnboardingLocale } from "@/lib/onboarding/locale";
import { saveOrganisationProfile } from "./actions";
beforeEach(() => { vi.clearAllMocks(); fake.country = null; fake.snapshot = "PT"; fake.type = "professional"; fake.metadata = "PT"; fake.readError = false; fake.locale = undefined; fake.cookie = undefined; });
it("defaults both portal and onboarding to Portuguese independently of country", async () => {
  fake.snapshot = "GB";
  expect(await getPortalLocale()).toBe("pt-PT");
  expect(await getOnboardingLocale()).toBe("pt-PT");
});
it("keeps Portugal market rules when English is selected", async () => {
  fake.locale = "en-GB";
  expect(await getPortalLocale()).toBe("en-GB");
  expect(await getOnboardingLocale()).toBe("en-GB");
  expect(await getAccountCountry()).toBe("PT");
});
it("lets an explicit cookie choose Portuguese for an English account", async () => {
  fake.locale = "en-GB"; fake.cookie = "pt-PT";
  expect(await getPortalLocale()).toBe("pt-PT");
});
it("preserves country snapshot despite changed profile or language", async () => {
  fake.locale = "en-GB"; fake.country = "GB";
  expect(await getAccountCountry()).toBe("PT");
});
it("fails closed when account market cannot be read", async () => {
  fake.readError = true;
  await expect(getAccountCountry()).rejects.toThrow("Could not determine account country");
});
it("persists signup PT for an organisation after changing the cookie", async () => {
  fake.type = "organisation";
  const form = new FormData();
  for (const [key, value] of Object.entries({ organisationName: "Care", contactPerson: "Ana", organisationCategory: "pt_sad", taxNumber: "501964843", addressLine1: "Rua Um", city: "Lisboa", postcode: "1000-001", billingEmail: "ana@example.test" })) form.set(key, value);
  expect(await saveOrganisationProfile(null, form)).toEqual({ ok: true });
  expect(fake.upsert.mock.calls[0][0]).toMatchObject({ country_code: "PT" });
});
it("preserves an existing organisation's GB country when signup metadata says PT", async () => {
  fake.type = "organisation"; fake.country = "GB"; fake.snapshot = "GB";
  const form = new FormData();
  for (const [key, value] of Object.entries({ organisationName: "Care", contactPerson: "Ana", addressLine1: "One Road", city: "London", postcode: "SW1A 1AA", billingEmail: "ana@example.test" })) form.set(key, value);
  expect(await saveOrganisationProfile(null, form)).toEqual({ ok: true });
  expect(fake.upsert.mock.calls[0][0]).toMatchObject({ country_code: "GB" });
});
