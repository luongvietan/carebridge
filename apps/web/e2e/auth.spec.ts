import { test, expect, request, type APIRequestContext, type Page } from "@playwright/test";

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
        if (link) return link.replace(/&amp;/g, "&");
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
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();

  await page.goto(await confirmationLink(api, opts.email));
}

async function login(page: Page, email: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
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
