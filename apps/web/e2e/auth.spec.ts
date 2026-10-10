import { test, expect, request, type APIRequestContext, type Page } from "@playwright/test";

import { localService, openPortugalForSuite, restorePortugalAfterSuite } from "./local-market";
import { createClient } from "@supabase/supabase-js";
let wasLive: boolean | undefined;
test.beforeAll(async () => { wasLive = await openPortugalForSuite(); });
test.afterAll(async () => { if (wasLive !== undefined) await restorePortugalAfterSuite(wasLive); });
const MAILPIT = "http://127.0.0.1:54324";
const PASSWORD = "password123";

async function confirmationLink(api: APIRequestContext, email: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await api.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + email)}`);
    if (res.ok()) {
      const json = await res.json();
      const hit = json.messages?.[0];
      if (hit) {
        const msg = await (await api.get(`${MAILPIT}/api/v1/message/${hit.ID}`)).json();
        const body: string = msg.HTML || msg.Text || "";
        const urls = body.match(/https?:\/\/[^"'\s<>]+/g) ?? [];
        const link = urls.find((u) => /verify|confirm|token/.test(u));
        if (link) {
          const url = new URL(link.replace(/&amp;/g, "&"));
          if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Confirmation email must target the isolated local stack.");
          // Auth templates use Supabase SiteURL; follow the app route on this
          // suite's baseURL when its test-server port differs from SiteURL.
          return url.pathname === "/auth/confirm" ? url.pathname + url.search : url.href;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No confirmation email for ${email}`);
}

async function registerAccount(
  page: Page,
  api: APIRequestContext,
  opts: {
    registerPath: string;
    fullName: string;
    email: string;
    accountType?: "organisation";
  },
) {
  await page.goto(opts.registerPath);
  if (opts.accountType === "organisation") {
    await page.locator('input[name="accountType"][value="organisation"]').check();
  }
  await page.locator('input[name="fullName"]').fill(opts.fullName);
  await page.locator('input[name="email"]').fill(opts.email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('input[name="acceptedTerms"]').check();
  await page.getByRole("button", { name: /criar conta/i }).click();
  await expect(page.getByRole("heading", { name: /verifique o seu email/i })).toBeVisible();

  await page.goto(await confirmationLink(api, opts.email));
}

async function login(page: Page, email: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });
}

test("professional registers, confirms, logs in and reaches their area", async ({ page }) => {
  const email = `pro_${Date.now()}@test.dev`;
  const api = await request.newContext();
  await registerAccount(page, api, {
    registerPath: "/register?as=professional",
    fullName: "E2E Pro",
    email,
  });
  await login(page, email, /\/professional/);
  // Supabase permits editing user_metadata; country must remain a stored fact.
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: signedIn, error: loginError } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  expect(loginError).toBeNull();
  const { error: metadataError } = await sb.auth.updateUser({ data: { market: "GB" } });
  expect(metadataError).toBeNull();
  const { data: account, error: accountError } = await localService().from("users").select("country_code").eq("id", signedIn.user!.id).single();
  expect(accountError).toBeNull();
  expect(account?.country_code).toBe("PT");
  await sb.auth.signOut();
});

test("private client registers, confirms, logs in and reaches their area", async ({ page }) => {
  const email = `client_${Date.now()}@test.dev`;
  const api = await request.newContext();
  await registerAccount(page, api, {
    registerPath: "/register?as=client",
    fullName: "E2E Client",
    email,
  });
  await login(page, email, /\/client/);
});

test("organisation registers, confirms, logs in and reaches their area", async ({ page }) => {
  const email = `org_${Date.now()}@test.dev`;
  const api = await request.newContext();
  await registerAccount(page, api, {
    registerPath: "/register?as=client",
    fullName: "E2E Org Contact",
    email,
    accountType: "organisation",
  });
  await login(page, email, /\/organisation/);
});

test("unauthenticated visit to a role area redirects to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("a wrong password shows the generic error and stays on the login page", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(`noone_${Date.now()}@test.dev`);
  await page.locator('input[name="password"]').fill("definitely-not-the-password");
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await expect(page.getByText(/email ou palavra-passe inválidos/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("signed-in professional is redirected away from admin area", async ({ page }) => {
  const email = `pro_guard_${Date.now()}@test.dev`;
  const api = await request.newContext();
  await registerAccount(page, api, {
    registerPath: "/register?as=professional",
    fullName: "Guard Pro",
    email,
  });
  await login(page, email, /\/professional/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/professional/);
});
