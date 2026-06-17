import { test, expect, request, type APIRequestContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { chooseFrom } from "./select-helper";

const MAILPIT = "http://127.0.0.1:54324";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function confirmationLink(api: APIRequestContext, email: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await api.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + email)}`);
    if (res.ok()) {
      const hit = (await res.json()).messages?.[0];
      if (hit) {
        const msg = await (await api.get(`${MAILPIT}/api/v1/message/${hit.ID}`)).json();
        const body: string = msg.HTML || msg.Text || "";
        const link = (body.match(/https?:\/\/[^"'\s<>]+/g) ?? []).find((u) => /verify|confirm|token/.test(u));
        if (link) return link.replace(/&amp;/g, "&");
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No confirmation email for ${email}`);
}

async function registerConfirmLogin(page: Page, api: APIRequestContext, email: string) {
  await page.goto("/register?as=professional");
  await page.locator('input[name="fullName"]').fill("E2E Pro");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.locator('input[name="acceptedTerms"]').check();
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
  await page.goto(await confirmationLink(api, email));
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/professional/);
}

// Correct option TEXT for each seeded placeholder question. The bank has 20
// common questions and no role-specific ones, so the 15+5 format serves all 20.
const CORRECT = [
  "Report it to the safeguarding lead promptly",
  "Hand hygiene",
  "Only on a lawful, need-to-know basis",
  "A boundary concern to be declared/declined",
  "Accurate, contemporaneous and legible",
  "The right patient, drug, dose, route and time",
  "Report and, if safe, mitigate it",
  "Decline and escalate to an appropriate professional",
  "Everyone working with them",
  "Before and after every patient contact",
  "Decline — there is no legitimate care reason",
  "Politely decline to maintain professional boundaries",
  "Score it out, initial and date the correction",
  "Check with a qualified prescriber/pharmacist before administering",
  "Carry out a risk assessment and use appropriate equipment",
  "Raise the concern through the appropriate channel",
  "Explain you may need to share it to keep them or others safe",
  "A sealed sharps container",
  "Access the personal data held about them",
  "Apron/gown",
];

test("professional completes the onboarding wizard and writes persist", async ({ page }) => {
  const api = await request.newContext();
  const sb = service();
  const email = `onb_${Date.now()}@test.dev`;
  await registerConfirmLogin(page, api, email);

  // Eligibility
  await page.goto("/professional/onboarding/eligibility");
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.getByText(/eligibility recorded/i)).toBeVisible();

  // Assessment — answer every question correctly
  await page.goto("/professional/onboarding/assessment");
  await page.getByRole("button", { name: /begin assessment/i }).click();
  await expect(page.getByText(/^1\./)).toBeVisible();
  for (const text of CORRECT) {
    await page.locator("label", { hasText: text }).locator('input[type="radio"]').check();
  }
  await page.getByRole("button", { name: /submit answers/i }).click();
  await expect(page.getByText(/Passed/)).toBeVisible();

  // Profile
  await page.goto("/professional/onboarding/profile");
  await chooseFrom(page, page.getByRole("combobox", { name: "Professional role" }), "Registered Nurse");
  await page.locator('input[name="addressLine1"]').fill("1 Test Street");
  await page.locator('input[name="city"]').fill("London");
  await page.locator('input[name="postcode"]').fill("E1 6AN");
  await page.getByRole("button", { name: /save profile/i }).click();
  await expect(page.getByText(/profile saved/i)).toBeVisible();

  // Documents — upload one required document. Use Qualification, a non-expiring
  // type, so no expiry date is required (the expiry field is a custom DatePicker).
  await page.goto("/professional/onboarding/documents");
  const qualItem = page.locator("div.p-4", { hasText: "Qualification" });
  await qualItem.locator('input[type="file"]').setInputFiles({
    name: "cert.pdf",
    mimeType: "application/pdf",
    // Must start with the %PDF magic bytes — uploads are content-sniffed.
    buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"),
  });
  await qualItem.getByRole("button", { name: /^upload$/i }).click();
  await expect(qualItem.getByText(/pending review/i)).toBeVisible();

  // Assert the write paths persisted
  const { data: prof } = await sb
    .from("professionals")
    .select("id, professional_role_id, address_line1")
    .eq("full_name", "E2E Pro")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  expect(prof?.professional_role_id).toBeTruthy();
  expect(prof?.address_line1).toBe("1 Test Street");

  const { count: elig } = await sb
    .from("eligibility_screenings")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", prof!.id);
  expect(elig).toBeGreaterThan(0);

  const { data: attempt } = await sb
    .from("assessment_attempts")
    .select("passed")
    .eq("professional_id", prof!.id)
    .limit(1)
    .single();
  expect(attempt?.passed).toBe(true);

  const { count: docs } = await sb
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", prof!.id);
  expect(docs).toBeGreaterThan(0);
});

test("admin approving the final critical document activates the professional", async ({ page, browser }) => {
  const sb = service();
  const stamp = Date.now();
  const proName = `FixturePro${stamp}`;

  // Admin user
  const adminEmail = `admin_${stamp}@test.dev`;
  const { data: adminUser } = await sb.auth.admin.createUser({
    email: adminEmail,
    password: "password123",
    email_confirm: true,
    user_metadata: { account_type: "admin", full_name: "E2E Admin" },
  });
  expect(adminUser.user).toBeTruthy();
  // Signup metadata can't grant admin (0031 hardening); promote the test admin.
  await sb.from("users").update({ account_type: "admin" }).eq("id", adminUser.user!.id);

  // Professional fixture: pending_verification, role with critical requirements,
  // all required critical docs already approved EXCEPT one pending.
  await new Promise((r) => setTimeout(r, 1200));
  const proEmail = `fixpro_${stamp}@test.dev`;
  const { data: proUser, error: proErr } = await sb.auth.admin.createUser({
    email: proEmail,
    password: "password123",
    email_confirm: true,
    user_metadata: { account_type: "professional", full_name: proName },
  });
  expect(proUser?.user, JSON.stringify({ proUser, proErr })).toBeTruthy();
  const { data: role } = await sb.from("professional_roles").select("id").eq("code", "registered_nurse").single();
  const { data: pro } = await sb
    .from("professionals")
    .insert({ user_id: proUser.user!.id, full_name: proName, professional_role_id: role!.id })
    .select("id")
    .single();

  // Activation now also requires a passed competency assessment (spec item 2),
  // so seed one for this fixture before approving the final document.
  await sb.from("assessment_attempts").insert({
    professional_id: pro!.id,
    attempt_number: 1,
    served_question_ids: [],
    score: 100,
    passed: true,
    completed_at: new Date().toISOString(),
  });

  const { data: reqs } = await sb
    .from("compliance_requirements")
    .select("document_type_id, document_types(is_compliance_critical)")
    .eq("professional_role_id", role!.id);
  const critical = (reqs ?? [])
    .filter((r) => {
      const dt = r.document_types as unknown as { is_compliance_critical: boolean } | { is_compliance_critical: boolean }[] | null;
      const row = Array.isArray(dt) ? dt[0] : dt;
      return row?.is_compliance_critical;
    })
    .map((r) => r.document_type_id);

  // All critical document types carry an expiry, which is now required.
  const fixtureExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let pendingDocId = "";
  for (let i = 0; i < critical.length; i++) {
    const status = i === 0 ? "pending_review" : "approved";
    const { data: doc } = await sb
      .from("documents")
      .insert({ professional_id: pro!.id, document_type_id: critical[i], storage_path: `x/${critical[i]}.pdf`, verification_status: status, expiry_date: fixtureExpiry })
      .select("id")
      .single();
    if (i === 0) pendingDocId = doc!.id;
  }

  // Admin logs in and approves the pending document via the UI.
  const ctx = await browser.newContext();
  const adminPage = await ctx.newPage();
  await adminPage.goto("/login");
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill("password123");
  await adminPage.getByRole("button", { name: /sign in/i }).click();
  await expect(adminPage).toHaveURL(/\/admin/);

  await adminPage.goto("/admin/compliance");
  const reviewRow = adminPage.locator("div.flex.flex-wrap", { hasText: proName });
  await expect(reviewRow).toBeVisible();
  await reviewRow.getByRole("button", { name: /^approve$/i }).click();
  await expect(reviewRow).toBeHidden({ timeout: 10000 });

  // The professional is now active and can accept bookings.
  const { data: after } = await sb
    .from("professionals")
    .select("professional_status, compliance_status, can_accept_bookings")
    .eq("id", pro!.id)
    .single();
  expect(after?.professional_status).toBe("active");
  expect(after?.compliance_status).toBe("approved");
  expect(after?.can_accept_bookings).toBe(true);

  await ctx.close();
  // Cleanup
  await sb.from("documents").delete().eq("professional_id", pro!.id);
  await sb.auth.admin.deleteUser(proUser.user!.id);
  await sb.auth.admin.deleteUser(adminUser.user!.id);
  void pendingDocId;
});

test("professional cannot download another professional's document from storage", async () => {
  const sb = service();
  const { createClient } = await import("@supabase/supabase-js");
  const stamp = Date.now();
  const ownerEmail = `docowner_${stamp}@test.dev`;
  const otherEmail = `docother_${stamp}@test.dev`;

  const ownerUserId = (
    await sb.auth.admin.createUser({
      email: ownerEmail,
      password: "password123",
      email_confirm: true,
      user_metadata: { account_type: "professional", full_name: "Doc Owner" },
    })
  ).data.user!.id;

  const otherUserId = (
    await sb.auth.admin.createUser({
      email: otherEmail,
      password: "password123",
      email_confirm: true,
      user_metadata: { account_type: "professional", full_name: "Doc Other" },
    })
  ).data.user!.id;

  await new Promise((r) => setTimeout(r, 1200));

  const { data: ownerProf, error: ownerErr } = await sb
    .from("professionals")
    .insert({ user_id: ownerUserId, full_name: "Doc Owner" })
    .select("id")
    .single();
  expect(ownerErr, JSON.stringify(ownerErr)).toBeNull();
  await sb.from("professionals").insert({ user_id: otherUserId, full_name: "Doc Other" });

  const { data: docType } = await sb.from("document_types").select("id").limit(1).single();
  const storagePath = `${ownerProf!.id}/dbs/test-${stamp}.pdf`;
  await sb.from("documents").insert({
    professional_id: ownerProf!.id,
    document_type_id: docType!.id,
    storage_path: storagePath,
    verification_status: "pending_review",
    // Set an expiry unconditionally — harmless for non-expiring types, required for expiring ones.
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { error: signInErr } = await anonClient.auth.signInWithPassword({
    email: otherEmail,
    password: "password123",
  });
  expect(signInErr).toBeNull();

  const { data: blob, error: dlErr } = await anonClient.storage.from("documents").download(storagePath);
  expect(dlErr).toBeTruthy();
  expect(blob).toBeNull();

  await sb.from("documents").delete().eq("professional_id", ownerProf!.id);
  await sb.from("professionals").delete().in("user_id", [ownerUserId, otherUserId]);
  await sb.auth.admin.deleteUser(ownerUserId);
  await sb.auth.admin.deleteUser(otherUserId);
});
