import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
    user_metadata: { account_type: "admin", full_name: "Matrix E2E Admin" },
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
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
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
