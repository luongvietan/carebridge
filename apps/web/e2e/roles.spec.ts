import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { chooseFrom } from "./select-helper";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/professional/);
}

test("a professional takes on a second role without disturbing the first", async ({ page }) => {
  const sb = service();
  const stamp = Date.now();
  const proName = `MultiRolePro${stamp}`;
  const email = `multirole_${stamp}@test.dev`;

  const { data: proUser } = await sb.auth.admin.createUser({
    email,
    password: "password123",
    email_confirm: true,
    user_metadata: { account_type: "professional", full_name: proName },
  });
  expect(proUser.user).toBeTruthy();

  const { data: firstRole } = await sb
    .from("professional_roles")
    .select("id, name")
    .eq("code", "healthcare_assistant")
    .single();

  // An active, approved professional in one role — the state somebody adding a
  // second role is actually in.
  const { data: pro } = await sb
    .from("professionals")
    .insert({
      user_id: proUser.user!.id,
      full_name: proName,
      professional_role_id: firstRole!.id,
      professional_status: "active",
      compliance_status: "approved",
    })
    .select("id")
    .single();
  await sb.from("assessment_attempts").insert({
    professional_id: pro!.id,
    professional_role_id: firstRole!.id,
    attempt_number: 1,
    served_question_ids: [],
    score: 100,
    passed: true,
    completed_at: new Date().toISOString(),
  });

  await signIn(page, email);
  await page.goto("/professional/roles");

  // The backfill/sync gave them their existing role, already active.
  const firstCard = page.locator("section", { hasText: firstRole!.name });
  await expect(firstCard.getByText("Active")).toBeVisible();

  await page.getByRole("button", { name: /add another role/i }).click();
  await chooseFrom(page, page.getByRole("combobox", { name: "Role" }), "Support Worker");
  await page.getByRole("button", { name: /^add role$/i }).click();

  // The new role appears, in progress, and says what it is waiting for.
  const secondCard = page.locator("section", { hasText: "Support Worker" });
  await expect(secondCard.getByText("In progress")).toBeVisible();
  await expect(secondCard.getByText(/pass the assessment for this role/i)).toBeVisible();

  // The first role is untouched — this is the whole point of per-role clearance.
  await expect(firstCard.getByText("Active")).toBeVisible();

  const { data: assignments } = await sb
    .from("professional_role_assignments")
    .select("status, is_primary, professional_roles(code)")
    .eq("professional_id", pro!.id);
  const byCode = new Map(
    (assignments ?? []).map((a) => [
      (a.professional_roles as unknown as { code: string }).code,
      a,
    ]),
  );
  expect(byCode.get("healthcare_assistant")?.status).toBe("active");
  expect(byCode.get("healthcare_assistant")?.is_primary).toBe(true);
  expect(byCode.get("support_worker")?.status).toBe("pending");
  expect(byCode.get("support_worker")?.is_primary).toBe(false);

  // And an open booking in the new role is not yet offered to them: holding a
  // role is not the same as being cleared for it.
  const { data: eligible } = await sb.rpc("fn_role_assignment_eligible", {
    p_professional_id: pro!.id,
    p_role_id: (
      await sb.from("professional_roles").select("id").eq("code", "support_worker").single()
    ).data!.id,
  });
  expect(eligible).toBe(false);
});
