import { test, expect, type Page, type Browser } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildBookingInsert } from "../src/lib/bookings/create";
import type { RateCard } from "../src/lib/rates/snapshot";
import { chooseFrom } from "./select-helper";
import { EMERGENCY_QUESTIONS, QUESTIONS, RESPONDENT_OPTIONS, RESPONDENT_QUESTION } from "../src/lib/risk-assessment/questionnaire";

const PASSWORD = "password123";

function service(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}


function formatDate(iso: string) {
  // The app renders booking times in Europe/London (formatLondon), so the test
  // has to as well — on a CI runner in UTC, a BST booking rendered an hour out
  // and no row matched.
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  });
}

function slot(hoursFromNow: number, durationHours: number) {
  const start = new Date(Date.now() + hoursFromNow * 3_600_000);
  // Keep the minute component so concurrently-seeded bookings get distinct times
  // (the admin list is filtered by displayed start time). The UI-driven happy
  // path computes its own whole-hour times separately.
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  return { start, end, startIso: start.toISOString(), endIso: end.toISOString() };
}

async function login(page: Page, email: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /^(Sign in|Entrar)$/i }).click();
  await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });
}

async function rnRoleId(sb: SupabaseClient, country = "GB") {
  const { data: role } = await sb.from("professional_roles").select("id").eq("code", country === "PT" ? "pt_enfermeiro_adulto" : "adult_nurse").single();
  if (!role) throw new Error("adult_nurse role missing");
  return role.id as string;
}

async function seedAdmin(sb: SupabaseClient, stamp: number) {
  const email = `bkadmin_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { market: "GB", preferred_locale: "en-GB", account_type: "admin", full_name: "E2E Admin" },
  });
  if (error || !data.user) throw error ?? new Error("admin user");
  // Signup metadata can't grant admin (0031 hardening downgrades it to
  // private_client); promote the trusted service-role-created test admin.
  await sb.from("users").update({ account_type: "admin" }).eq("id", data.user.id);
  return { email, userId: data.user.id };
}

async function seedClient(sb: SupabaseClient, stamp: number, market = "GB") {
  const email = `bkclient_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "private_client", full_name: "E2E Client", market, preferred_locale: market === "PT" ? "pt-PT" : "en-GB" },
  });
  if (error || !data.user) throw error ?? new Error("client user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: client, error: cErr } = await sb
    .from("private_clients")
    .insert({ user_id: data.user.id, full_name: "E2E Client", stripe_customer_id: "cus_stub_e2e", address_line1: "1 Test Street", city: "Manchester", postcode: "M1 1AA" })
    .select("id")
    .single();
  if (cErr || !client) throw cErr ?? new Error("private_clients insert");
  return { email, userId: data.user.id, clientId: client.id as string };
}

type ProSeed = { email: string; userId: string; proId: string; name: string };

async function seedEligiblePro(sb: SupabaseClient, stamp: number, roleId: string): Promise<ProSeed> {
  const { data: role } = await sb.from("professional_roles").select("country_code").eq("id", roleId).single();
  const name = `EligiblePro${stamp}`;
  const email = `bkpro_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "professional", full_name: name, market: role!.country_code, preferred_locale: role!.country_code === "PT" ? "pt-PT" : "en-GB" },
  });
  if (error || !data.user) throw error ?? new Error("pro user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: pro, error: pErr } = await sb
    .from("professionals")
    .insert({
      user_id: data.user.id,
      full_name: name,
      country_code: role!.country_code,
      professional_role_id: roleId,
      professional_status: "active",
      compliance_status: "approved",
    })
    .select("id, can_accept_bookings")
    .single();
  if (pErr || !pro) throw pErr ?? new Error("professional insert");
  if (!pro.can_accept_bookings) throw new Error("pro should be eligible");
  return { email, userId: data.user.id, proId: pro.id as string, name };
}

async function seedOpenBooking(
  sb: SupabaseClient,
  input: {
    requesterUserId: string;
    privateClientId: string;
    professionalRoleId: string;
    scheduledStart: string;
    scheduledEnd: string;
    locationAddress: string;
  },
) {
  const { data: rateCard, error: rcErr } = await sb
    .from("rate_cards")
    .select("id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency")
    .eq("professional_role_id", input.professionalRoleId)
    .is("effective_to", null)
    .single();
  if (rcErr || !rateCard) throw rcErr ?? new Error("rate card");
  const insert = buildBookingInsert(
    {
      requesterUserId: input.requesterUserId,
      privateClientId: input.privateClientId,
      professionalRoleId: input.professionalRoleId,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      locationAddress: input.locationAddress,
    },
    rateCard as RateCard,
  );
  const { data: booking, error } = await sb
    .from("bookings")
    .insert({ ...insert, created_by: input.requesterUserId })
    .select("id, duration_hours, total_client_charge, total_payout")
    .single();
  if (error || !booking) throw error ?? new Error("booking insert");
  await sb.from("booking_status_history").insert({
    booking_id: booking.id,
    to_status: "open",
    changed_by: input.requesterUserId,
  });
  return booking;
}

// The role/date fields are custom Select / DateTimePicker components, so drive
// their actual UI (popover + day buttons keyed by data-ymd + Hour Select).
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Pick a day only; the DateTimePicker commits the clicked day at its default
// 09:00, which avoids the fragile nested Hour/Minute Selects. Callers therefore
// use 09:00 times on distinct days.
async function pickDate(page: Page, triggerName: string, d: Date) {
  await page.getByRole("button", { name: triggerName, exact: true }).click();
  await page.locator(`[data-ymd="${ymd(d)}"]`).click();
  await page.keyboard.press("Escape"); // close the popover before the next field
}

// Private clients answer the risk and needs assessment before the booking form:
// who is answering and consent, the emergency screen, then only the questions
// that apply. Unlisted questions take their first (calmest) option.
const pickIn = (page: Page, legend: string, label: string) =>
  page.getByRole("group", { name: legend, exact: true }).getByText(label, { exact: true }).click();

async function startRiskAssessment(page: Page) {
  await pickIn(page, RESPONDENT_QUESTION.pt, RESPONDENT_OPTIONS[1].label.pt);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
}

async function completeRiskAssessment(page: Page, answers: Record<string, string> = {}) {
  await startRiskAssessment(page);
  for (const q of EMERGENCY_QUESTIONS) await pickIn(page, q.label.pt, "Não");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  // Two passes: answering can reveal follow-up questions.
  for (let pass = 0; pass < 2; pass++) {
    for (const q of QUESTIONS) {
      const group = page.getByRole("group", { name: q.label.pt, exact: true });
      if ((await group.count()) === 0) continue;
      const option = q.options.find((o) => o.id === (answers[q.id] ?? q.options[0].id))!;
      await group.getByText(option.label.pt, { exact: true }).click();
    }
  }
  await page.getByRole("button", { name: "Ver recomendação" }).click();
  await expect(page.getByRole("heading", { name: "A nossa recomendação" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar para os dados da marcação" }).click();
}

async function fillBookingForm(page: Page, location: string, start: Date, durationLabel: string) {
  await chooseFrom(page, page.getByRole("combobox", { name: "Categoria profissional", exact: true }), "Enfermeiro/a — Adultos");
  await pickDate(page, "Início", start);
  await chooseFrom(page, page.getByRole("combobox", { name: "Duração do serviço", exact: true }), durationLabel);
  await page.locator('input[name="locationAddress"]').fill(location);
  await page.locator('input[name="locationPostcode"]').fill("E1 6AN");
  await page.getByRole("button", { name: /rever marcação/i }).click();
  await expect(page.getByRole("heading", { name: /rever marcação/i })).toBeVisible();
  await page.getByRole("button", { name: /criar marcação/i }).click();
}

test("Portugal happy path: client creates EUR booking, professional accepts", async ({ page, browser }) => {
  const sb = service();
  const stamp = Date.now();
  const { data: prior } = await sb.from("countries").select("is_live").eq("code", "PT").single();
  await sb.from("countries").update({ is_live: true }).eq("code", "PT");
  try {
  const roleId = await rnRoleId(sb, "PT");
  const client = await seedClient(sb, stamp, "PT");
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const location = `OpenMarket ${stamp}`;

  await login(page, client.email, /\/client/);
  await page.goto("/client/bookings/new");
  // A calm, green request; booking a nurse where support would do is allowed,
  // so the request is published straight away.
  await completeRiskAssessment(page);
  // 09:00 two days out, so the date picker only needs a day click (its committed
  // default time is 09:00) — no fragile hour/minute selection. Shift duration is
  // now a Select; pick a whole-hour preset and let the form compute the end.
  const start = new Date(Date.now() + 48 * 3_600_000);
  start.setHours(9, 0, 0, 0);
  await fillBookingForm(page, location, start, "8 horas"); // submits the form
  await expect(page.getByRole("heading", { name: "Pedido de marcação criado" })).toBeVisible();
  await page.getByRole("link", { name: "Ver marcações", exact: true }).click();
  await expect(page).toHaveURL(/\/client\/bookings\/?$/);
  await expect(page.locator("tr", { hasText: start.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }) })).toBeVisible();

  const { data: created } = await sb
    .from("bookings")
    .select("id, status, duration_hours, total_client_charge, total_payout, snap_currency")
    .eq("location_address", location)
    .single();
  expect(created?.status).toBe("open");
  expect(created?.snap_currency.trim()).toBe("EUR");
  // Derive the expected totals from the active rate card rather than hardcoding
  // 40/28 — another test may have amended the shared rate card.
  const { data: activeRate } = await sb
    .from("rate_cards")
    .select("client_charge_rate, professional_payout_rate")
    .eq("professional_role_id", roleId)
    .is("effective_to", null)
    .single();
  const expectedCharge =
    Math.round(Number(created!.duration_hours) * Number(activeRate!.client_charge_rate) * 100) / 100;
  const expectedPayout =
    Math.round(Number(created!.duration_hours) * Number(activeRate!.professional_payout_rate) * 100) / 100;
  expect(Number(created!.total_client_charge)).toBe(expectedCharge);
  expect(Number(created!.total_payout)).toBe(expectedPayout);

  const proCtx = await browser.newContext();
  const proPage = await proCtx.newPage();
  await login(proPage, pro.email, /\/professional/);
  await proPage.goto("/professional/bookings");
  const row = proPage.locator("tr", { hasText: location });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /^aceitar$/i }).click();
  await expect(row.getByText(/aceite/i)).toBeVisible({ timeout: 15_000 });

  const { data: after } = await sb
    .from("bookings")
    .select("status, assigned_professional_id, total_client_charge, total_payout")
    .eq("id", created!.id)
    .single();
  expect(after?.status).toBe("accepted");
  expect(after?.assigned_professional_id).toBe(pro.proId);
  expect(Number(after!.total_client_charge)).toBe(expectedCharge);
  expect(Number(after!.total_payout)).toBe(expectedPayout);
  await proCtx.close();
  } finally {
    await sb.from("countries").update({ is_live: prior!.is_live }).eq("code", "PT");
  }
});

test("Portugal: emergency answers stop the form; a high-risk request waits for admin review", async ({ page, browser }) => {
  const sb = service();
  const stamp = Date.now();
  const { data: prior } = await sb.from("countries").select("is_live").eq("code", "PT").single();
  await sb.from("countries").update({ is_live: true }).eq("code", "PT");
  try {
    const roleId = await rnRoleId(sb, "PT");
    const client = await seedClient(sb, stamp, "PT");
    const pro = await seedEligiblePro(sb, stamp + 1, roleId);
    const adminUser = await seedAdmin(sb, stamp + 2);
    const location = `HeldForReview ${stamp}`;

    await login(page, client.email, /\/client/);
    await page.goto("/client/bookings/new");

    // Any emergency "yes" stops the booking and shows the 112 guidance.
    await startRiskAssessment(page);
    await pickIn(page, EMERGENCY_QUESTIONS[0].label.pt, "Sim");
    await expect(page.getByRole("heading", { name: "Ligue já 112" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ligar 112" })).toHaveAttribute("href", "tel:112");
    await page.getByRole("link", { name: "Compreendo" }).click();
    await expect(page).toHaveURL(/\/client\/bookings\/?$/);
    const { count: afterEmergency } = await sb
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("requester_user_id", client.userId);
    expect(afterEmergency).toBe(0);

    // Medicine administration is a nursing outcome: held, nurse only.
    await page.goto("/client/bookings/new");
    await completeRiskAssessment(page, { C1: "administer" });
    await expect(page.getByText("A nossa equipa vai analisar este pedido antes de o publicar aos profissionais.")).toBeVisible();
    const start = new Date(Date.now() + 72 * 3_600_000);
    start.setHours(9, 0, 0, 0);
    await fillBookingForm(page, location, start, "4 horas");
    await expect(page.getByRole("heading", { name: "Pedido recebido — em análise" })).toBeVisible();

    const { data: held } = await sb.from("bookings").select("id, status").eq("location_address", location).single();
    expect(held?.status).toBe("pending_review");
    const { data: assessment } = await sb
      .from("booking_risk_assessments")
      .select("risk_level, outcome, recommended_role_family, review_reasons, requires_review")
      .eq("booking_id", held!.id)
      .single();
    expect(assessment).toMatchObject({ risk_level: "red", outcome: "N", recommended_role_family: "nurse_adult", requires_review: true });
    expect(assessment?.review_reasons).toContain("medicine_administration");

    // Professionals cannot see a held request.
    const proCtx = await browser.newContext();
    const proPage = await proCtx.newPage();
    await login(proPage, pro.email, /\/professional/);
    await proPage.goto("/professional/bookings");
    await expect(proPage.locator("tr", { hasText: location })).toHaveCount(0);

    // An admin approves it; it opens to matching professionals.
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, adminUser.email, /\/admin/);
    await adminPage.goto("/admin/bookings/review");
    const card = adminPage.locator("article", { hasText: location });
    await expect(card).toBeVisible();
    // A nursing request waits for a clinical reviewer; an ordinary admin cannot decide it.
    await expect(card.getByText("Clinical review required")).toBeVisible();
    await expect(card.getByRole("button", { name: "Approve and publish" })).toHaveCount(0);
    await sb.from("users").update({ is_clinical_reviewer: true }).eq("id", adminUser.userId);
    await adminPage.reload();
    await card.getByLabel("Reason and risk-control measures (internal)").fill("Nurse confirmed by phone; medication plan seen.");
    await card.getByLabel("Instructions for the professional (added to the safety brief)").fill("Bring gloves.");
    await card.getByRole("button", { name: "Approve and publish" }).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });
    const { data: approved } = await sb.from("bookings").select("status").eq("id", held!.id).single();
    expect(approved?.status).toBe("open");

    await proPage.reload();
    const openRow = proPage.locator("tr", { hasText: location });
    await expect(openRow).toBeVisible();
    // The matched professional sees only the safety brief, and each view is logged.
    await openRow.getByRole("button", { name: "Informação de segurança" }).click();
    await expect(openRow.getByText("Administração de medicamentos (enfermeiro)")).toBeVisible();
    await expect(openRow.getByText("Bring gloves.")).toBeVisible();
    await expect(async () => {
      const { count } = await sb
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .eq("action", "booking.safety_brief_viewed")
        .eq("entity_id", held!.id);
      expect(count).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 15_000 });
    await proCtx.close();
    await adminCtx.close();
  } finally {
    await sb.from("countries").update({ is_live: prior!.is_live }).eq("code", "PT");
  }
});

test("legacy UK client keeps history but cannot create new UK bookings", async ({ page }) => {
  const sb = service();
  const client = await seedClient(sb, Date.now());
  await login(page, client.email, /\/client/);
  await page.goto("/client/bookings/new");
  await expect(page.getByRole("heading", { name: "Bookings launching soon" })).toBeVisible();
  await expect(page.locator('input[name="locationAddress"]')).toHaveCount(0);
});

test("admin assigns an eligible professional to an open booking", async ({ page }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const admin = await seedAdmin(sb, stamp + 2);
  const location = `AdminAssign ${stamp}`;
  const { startIso, endIso } = slot(72, 3);
  const booking = await seedOpenBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    scheduledStart: startIso,
    scheduledEnd: endIso,
    locationAddress: location,
  });

  await login(page, admin.email, /\/admin/);
  await page.goto("/admin/bookings");
  const row = page.locator("tr", { hasText: formatDate(startIso) });
  await expect(row).toBeVisible();
  await chooseFrom(page, row.getByRole("combobox"), pro.name);
  await row.getByRole("button", { name: /^assign$/i }).click();
  await expect(row.locator("span", { hasText: /^assigned$/ })).toBeVisible({ timeout: 15_000 });

  const { data: after } = await sb
    .from("bookings")
    .select("status, booking_type, assigned_professional_id")
    .eq("id", booking.id)
    .single();
  expect(after?.status).toBe("assigned");
  expect(after?.booking_type).toBe("admin_assigned");
  expect(after?.assigned_professional_id).toBe(pro.proId);
});

test("admin assign blocked when professional becomes ineligible", async ({ page }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const admin = await seedAdmin(sb, stamp + 2);
  const location = `AdminBlock ${stamp}`;
  const { startIso, endIso } = slot(80, 2);
  const booking = await seedOpenBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    scheduledStart: startIso,
    scheduledEnd: endIso,
    locationAddress: location,
  });

  await login(page, admin.email, /\/admin/);
  await page.goto("/admin/bookings");
  const row = page.locator("tr", { hasText: formatDate(startIso) });
  await chooseFrom(page, row.getByRole("combobox"), pro.name);

  await sb.from("professionals").update({ professional_status: "pending_verification" }).eq("id", pro.proId);
  await row.getByRole("button", { name: /^assign$/i }).click();
  await expect(row.getByText(/not currently eligible/i)).toBeVisible();

  const { data: after } = await sb.from("bookings").select("status").eq("id", booking.id).single();
  expect(after?.status).toBe("open");
});

test("professional accept blocked when no longer eligible", async ({ browser }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const location = `ProBlock ${stamp}`;
  const { startIso, endIso } = slot(96, 2);
  await seedOpenBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    scheduledStart: startIso,
    scheduledEnd: endIso,
    locationAddress: location,
  });

  const proCtx = await browser.newContext();
  const proPage = await proCtx.newPage();
  await login(proPage, pro.email, /\/professional/);
  await proPage.goto("/professional/bookings");
  const row = proPage.locator("tr", { hasText: location });
  await expect(row).toBeVisible();

  await sb.from("professionals").update({ professional_status: "pending_verification" }).eq("id", pro.proId);
  await row.getByRole("button", { name: /^accept$/i }).click();
  await expect(row.getByText(/not currently eligible/i)).toBeVisible();

  const { data: after } = await sb.from("bookings").select("status").eq("location_address", location).single();
  expect(after?.status).toBe("open");
  await proCtx.close();
});

test("professional declines an open booking", async ({ browser }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const location = `Decline ${stamp}`;
  const { startIso, endIso } = slot(120, 2);
  const booking = await seedOpenBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    scheduledStart: startIso,
    scheduledEnd: endIso,
    locationAddress: location,
  });

  const proCtx = await browser.newContext();
  const proPage = await proCtx.newPage();
  await login(proPage, pro.email, /\/professional/);
  await proPage.goto("/professional/bookings");
  const row = proPage.locator("tr", { hasText: location });
  await row.getByRole("button", { name: /^decline$/i }).click();
  // Undo-decline feature: the row is not removed — it now offers "Undo decline".
  await expect(row.getByRole("button", { name: /undo decline/i })).toBeVisible({ timeout: 15_000 });

  const { count } = await sb
    .from("booking_declines")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", booking.id)
    .eq("professional_id", pro.proId);
  expect(count).toBe(1);

  // The decline persists across a reload (still shown with an Undo option).
  await proPage.reload();
  await expect(
    proPage.locator("tr", { hasText: location }).getByRole("button", { name: /undo decline/i }),
  ).toBeVisible();
  await proCtx.close();
});

test("client last-minute cancel after accept", async ({ page, browser }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const location = `LastMin ${stamp}`;
  const { startIso, endIso } = slot(2, 2);
  const booking = await seedOpenBooking(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    scheduledStart: startIso,
    scheduledEnd: endIso,
    locationAddress: location,
  });

  const proCtx = await browser.newContext();
  const proPage = await proCtx.newPage();
  await login(proPage, pro.email, /\/professional/);
  await proPage.goto("/professional/bookings");
  await proPage.locator("tr", { hasText: location }).getByRole("button", { name: /^accept$/i }).click();
  await expect(proPage.locator("tr", { hasText: location }).getByText(/accepted/i)).toBeVisible({ timeout: 15_000 });
  await proCtx.close();

  await login(page, client.email, /\/client/);
  await page.goto("/client/bookings");
  const cancelTr = page.locator("tr", { hasText: formatDate(startIso) });
  await cancelTr.getByRole("button", { name: /^cancel$/i }).click();
  // The app uses its own confirmation dialog, not window.confirm.
  await page.getByRole("button", { name: /^cancel booking$/i }).click();
  await expect(cancelTr.getByText(/cancelled/i)).toBeVisible({ timeout: 15_000 });

  const { data: cancelRow } = await sb
    .from("booking_cancellations")
    .select("is_last_minute")
    .eq("booking_id", booking.id)
    .single();
  expect(cancelRow?.is_last_minute).toBe(true);
});
