import { test, expect, request, type APIRequestContext } from "@playwright/test";

const MAILPIT = "http://127.0.0.1:54324";

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

test("professional registers, confirms, logs in and reaches their area", async ({ page }) => {
  const email = `pro_${Date.now()}@test.dev`;
  const api = await request.newContext();

  await page.goto("/register");
  await page.locator('input[name="fullName"]').fill("E2E Pro");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.locator('input[name="acceptedTerms"]').check();
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();

  const link = await confirmationLink(api, email);
  await page.goto(link);

  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/professional/);
});

test("unauthenticated visit to a role area redirects to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
