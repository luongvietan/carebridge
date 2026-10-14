import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { localService } from "../local-market";

const PASSWORD = "password123";

function service(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function seedAdmin(sb: SupabaseClient, stamp: number) {
  const email = `matrixadmin_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { market: "GB", account_type: "admin", full_name: "Matrix E2E Admin" },
  });
  if (error || !data.user) throw error ?? new Error("admin user");
  // Signup metadata can't grant admin (0031 hardening downgrades it to
  // private_client); promote the trusted service-role-created test admin.
  await sb.from("users").update({ account_type: "admin" }).eq("id", data.user.id);
  return { email, userId: data.user.id };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^(Sign in|Entrar)$/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
}

test("public landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
});

test("login form renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("login supports labelled fields, keyboard navigation and narrow screens", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Saltar para o conteúdo principal" })).toHaveAttribute("href", "#main-content");
  const email = page.getByLabel(/email/i);
  const password = page.getByLabel(/palavra-passe/i);
  await email.focus();
  await page.keyboard.type("keyboard@example.test");
  await expect(email).toHaveValue("keyboard@example.test");
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.type("local-keyboard-check");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test("a legacy UK cookie keeps Portugal content and UK launching soon", async ({ page, context }) => {
  await context.addCookies([{ name: "cbc_market", value: "GB", url: "http://127.0.0.1:3100" }]);
  await page.goto("/");
  await expect(page.getByRole("list", { name: "Países onde operamos" })).toContainText("Reino Unido");
  await expect(page.getByRole("list", { name: "Países onde operamos" })).toContainText("em breve");
  await expect(page.getByRole("button", { name: /Reino Unido/ })).toHaveCount(0);
});

test("public registration stays closed before Portugal approval", async ({ page }) => {
  const sb = localService();
  const { data: prior } = await sb.from("countries").select("is_live").eq("code", "PT").single();
  await sb.from("countries").update({ is_live: false }).eq("code", "PT");
  try {
    await page.goto("/register?as=professional");
    await expect(page.getByRole("heading", { name: "As inscrições abrem em breve" })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
  } finally {
    await sb.from("countries").update({ is_live: prior!.is_live }).eq("code", "PT");
  }
});

test("contact saves an enquiry without claiming an unconfigured email was sent", async ({ page }) => {
  const sb = localService();
  const email = `matrixcontact_${Date.now()}@test.dev`;
  try {
    await page.goto("/contact");
    await page.locator('input[name="name"]').fill("Trial enquiry");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('textarea[name="message"]').fill("Local isolated enquiry test.");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText("A mensagem está guardada. Não foi enviado um novo email de confirmação.")).toBeVisible();
    const { count, error } = await sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", email);
    expect(error).toBeNull();
    expect(count).toBe(1);
  } finally {
    await sb.from("contact_messages").delete().eq("email", email);
  }
});

test("export endpoint rejects an unauthenticated request", async ({ request }) => {
  const res = await request.get("/api/export/bookings?format=csv");
  expect(res.status()).toBe(403);
});

test("admin downloads a CSV export from the reports page", async ({ page }) => {
  const sb = service();
  const admin = await seedAdmin(sb, Date.now());
  try {
    await login(page, admin.email);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: /reports & exports/i })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download Professionals as CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^carebridge-.*\.csv$/);
  } finally {
    await sb.auth.admin.deleteUser(admin.userId);
  }
});
