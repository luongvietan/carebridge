import { test, expect, request, type APIRequestContext, type Page } from "@playwright/test";

import { chooseFrom } from "./select-helper";
import { localService, openPortugalForSuite, restorePortugalAfterSuite } from "./local-market";
let wasLive: boolean | undefined;
test.beforeAll(async () => { wasLive = await openPortugalForSuite(); });
test.afterAll(async () => { if (wasLive !== undefined) await restorePortugalAfterSuite(wasLive); });

const MAILPIT = "http://127.0.0.1:54324";

const service = localService;

async function confirmationLink(api: APIRequestContext, email: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await api.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + email)}`);
    if (res.ok()) {
      const hit = (await res.json()).messages?.[0];
      if (hit) {
        const msg = await (await api.get(`${MAILPIT}/api/v1/message/${hit.ID}`)).json();
        const body: string = msg.HTML || msg.Text || "";
        const link = (body.match(/https?:\/\/[^"'\s<>]+/g) ?? []).find((u) => /verify|confirm|token/.test(u));
        if (link) {
          const url = new URL(link.replace(/&amp;/g, "&"));
          if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Confirmation email must target the isolated local stack.");
          return url.pathname === "/auth/confirm" ? url.pathname + url.search : url.href;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No confirmation email for ${email}`);
}

async function registerConfirmLogin(page: Page, api: APIRequestContext, email: string) {
  await page.goto("/register?as=professional");
  await page.locator('input[name="fullName"]').fill(`E2E ${email}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.locator('input[name="acceptedTerms"]').check();
  await page.getByRole("button", { name: /criar conta/i }).click();
  await expect(page.getByRole("heading", { name: /verifique o seu email/i })).toBeVisible();
  await page.goto(await confirmationLink(api, email), { waitUntil: "commit" });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("password123");
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/professional/);
}

test("professional completes the onboarding wizard and writes persist", async ({ page }) => {
  const api = await request.newContext();
  const sb = service();
  const email = `onb_${Date.now()}@test.dev`;
  await registerConfirmLogin(page, api, email);

  // Eligibility
  await page.goto("/professional/onboarding/eligibility");
  await page.getByRole("button", { name: /^continuar$/i }).click();
  await expect(page.getByText(/elegibilidade registada/i)).toBeVisible();

  // Assessment — answer every question correctly
  await page.goto("/professional/onboarding/assessment");
  await page.getByRole("button", { name: /iniciar avaliação/i }).click();
  await expect(page.getByText(/^1\./)).toBeVisible();
  const { data: answers, error: answersError } = await sb.from("assessment_question_bank").select("id, correct_option").eq("country_code", "PT").eq("is_active", true).is("professional_role_id", null);
  expect(answersError).toBeNull();
  expect(await page.locator("fieldset").count()).toBe(20);
  for (const answer of answers ?? []) {
    const option = page.locator(`input[name="${answer.id}"][value="${answer.correct_option}"]`);
    if (await option.count()) await option.check();
  }
  await page.getByRole("button", { name: /submeter respostas/i }).click();
  await expect(page.getByText(/Aprovado\(a\)/)).toBeVisible();

  // Profile
  await page.goto("/professional/onboarding/profile");
  await chooseFrom(page, page.getByRole("combobox", { name: "Categoria profissional" }), "Enfermeiro/a — Adultos");
  // Portuguese applicants provide a cédula, NIF and NISS, without a UK share code.
  await page.locator('input[name="registrationNumber"]').fill("12345");
  await page.locator('input[name="nationalInsuranceNo"]').fill("245076441");
  await page.locator('input[name="niss"]').fill("12345678901");
  await page.locator('input[name="addressLine1"]').fill("1 Test Street");
  await page.locator('input[name="city"]').fill("Lisboa");
  await page.locator('input[name="postcode"]').fill("1000-001");
  await page.getByRole("button", { name: /guardar perfil/i }).click();
  await expect(page.getByText(/perfil guardado/i)).toBeVisible();

  // Documents — upload one required document. Use Qualification, a non-expiring
  // type, so no expiry date is required (the expiry field is a custom DatePicker).
  await page.goto("/professional/onboarding/documents");
  // The PT reference data uses the Portuguese qualification label; keep this
  // selector locale-aware instead of coupling the journey to the legacy GB name.
  const qualItem = page
    .locator("div.p-4")
    .filter({ has: page.locator('input[type="file"]') })
    .filter({ hasText: /qualifica|habilita|qualification/i })
    .first();
  await qualItem.locator('input[type="file"]').setInputFiles({
    name: "cert.pdf",
    mimeType: "application/pdf",
    // Must start with the %PDF magic bytes — uploads are content-sniffed.
    buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"),
  });
  await qualItem.getByRole("button", { name: /^enviar$/i }).click();
  await expect(qualItem.getByText(/em análise/i)).toBeVisible();

  // Assert the write paths persisted
  const { data: prof } = await sb
    .from("professionals")
    .select("id, professional_role_id, address_line1, country_code, niss, national_insurance_no")
    .eq("full_name", `E2E ${email}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  expect(prof?.country_code).toBe("PT");
  expect(prof?.niss).toBe("12345678901");
  expect(prof?.national_insurance_no).toBe("245076441");
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

  // A complete common bank does not substitute for absent specialist content.
  const { count: specialist, error: poolError } = await sb.from("assessment_question_bank").select("id", { count: "exact", head: true }).eq("professional_role_id", prof!.professional_role_id).eq("country_code", "PT").eq("is_active", true);
  expect(poolError).toBeNull();
  expect(specialist).toBe(0);
  const { count: attemptsBefore } = await sb.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("professional_id", prof!.id);
  await page.goto(`/professional/onboarding/assessment?role=${prof!.professional_role_id}`);
  await page.getByRole("button", { name: /iniciar avaliação/i }).click();
  await expect(page.getByText(/ainda está em preparação/i)).toBeVisible();
  const { count: attemptsAfter } = await sb.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("professional_id", prof!.id);
  expect(attemptsAfter).toBe(attemptsBefore);
});

test("a regulated professional activates only once documents are approved AND the register is checked", async ({ browser }) => {
  const sb = service();
  const stamp = Date.now();
  const proName = `FixturePro${stamp}`;

  // Admin user
  const adminEmail = `admin_${stamp}@test.dev`;
  const { data: adminUser } = await sb.auth.admin.createUser({
    email: adminEmail,
    password: "password123",
    email_confirm: true,
    user_metadata: { account_type: "admin", full_name: "E2E Admin", market: "GB" },
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
    user_metadata: { account_type: "professional", full_name: proName, market: "PT" },
  });
  expect(proUser?.user, JSON.stringify({ proUser, proErr })).toBeTruthy();
  const { data: role } = await sb.from("professional_roles").select("id").eq("code", "pt_enfermeiro_adulto").single();
  const { data: pro } = await sb
    .from("professionals")
    .insert({ user_id: proUser.user!.id, full_name: proName, professional_role_id: role!.id, country_code: "PT" })
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
  await adminPage.getByRole("button", { name: /^entrar$/i }).click();
  await expect(adminPage).toHaveURL(/\/admin/);

  await adminPage.goto("/admin/compliance");
  // Scope to the review queue: the registration panel below it also carries the
  // professional's name in a flex-wrap row.
  const reviewSection = adminPage.locator("section", {
    has: adminPage.getByRole("heading", { name: "Documents awaiting review" }),
  });
  const reviewRow = reviewSection.locator("div.flex.flex-wrap", { hasText: proName });
  await expect(reviewRow).toBeVisible();
  const pendingReviewCount = await reviewRow.count();
  await reviewRow.getByRole("button", { name: /^approve$/i }).click();
  // The fixture can have several critical documents; approving one removes one
  // row rather than hiding the professional's remaining pending documents.
  await expect.poll(() => reviewRow.count(), { timeout: 10000 }).toBeLessThan(pendingReviewCount);

  // Every document is approved, but this is a nursing role: until an
  // administrator has checked the NMC register, the professional must NOT be
  // able to accept bookings (client requirement, 7 Aug 2026).
  const { data: beforeVerification } = await sb
    .from("professionals")
    .select("professional_status, can_accept_bookings")
    .eq("id", pro!.id)
    .single();
  expect(beforeVerification?.professional_status).not.toBe("active");
  expect(beforeVerification?.can_accept_bookings).toBe(false);

  // Record the register check through the admin UI.
  const registrationSection = adminPage.locator("section", {
    has: adminPage.getByRole("heading", { name: "Registrations awaiting verification" }),
  });
  const checkForm = registrationSection.locator("form", { hasText: proName });
  await expect(checkForm).toBeVisible();
  await checkForm.locator('input[name="reference"]').fill("12345");
  await chooseFrom(
    adminPage,
    checkForm.getByRole("combobox", { name: "What the register showed" }),
    "Registration is active and details match",
  );
  await checkForm.locator('input[name="confirmActive"]').check();
  await checkForm.locator('input[name="confirmIdentity"]').check();
  await checkForm.getByRole("button", { name: /record verification/i }).click();

  // Only now is the professional active and bookable.
  await expect(async () => {
    const { data: after } = await sb
      .from("professionals")
      .select("professional_status, compliance_status, can_accept_bookings")
      .eq("id", pro!.id)
      .single();
    expect(after?.professional_status).toBe("active");
    expect(after?.compliance_status).toBe("approved");
    expect(after?.can_accept_bookings).toBe(true);
  }).toPass({ timeout: 15_000 });

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
    .insert({ user_id: ownerUserId, full_name: "Doc Owner", country_code: "PT" })
    .select("id")
    .single();
  expect(ownerErr, JSON.stringify(ownerErr)).toBeNull();
  await sb.from("professionals").insert({ user_id: otherUserId, full_name: "Doc Other", country_code: "PT" });

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
  const { error: uploadError } = await sb.storage.from("documents").upload(storagePath, Buffer.from("%PDF-1.4\n%%EOF"), { contentType: "application/pdf" });
  expect(uploadError).toBeNull();

  // Prove the file exists and its owner can read it before testing denial.
  const ownerClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  expect((await ownerClient.auth.signInWithPassword({ email: ownerEmail, password: "password123" })).error).toBeNull();
  const ownDownload = await ownerClient.storage.from("documents").download(storagePath);
  expect(ownDownload.error).toBeNull();
  expect(ownDownload.data).toBeTruthy();

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

  await sb.storage.from("documents").remove([storagePath]);
  await sb.from("documents").delete().eq("professional_id", ownerProf!.id);
  await sb.from("professionals").delete().in("user_id", [ownerUserId, otherUserId]);
  await sb.auth.admin.deleteUser(ownerUserId);
  await sb.auth.admin.deleteUser(otherUserId);
});
