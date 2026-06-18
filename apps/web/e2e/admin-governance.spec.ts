import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildBookingInsert } from "../src/lib/bookings/create";
import type { RateCard } from "../src/lib/rates/snapshot";
import { chooseFrom } from "./select-helper";

const PASSWORD = "password123";

// ---------------------------------------------------------------------------
// Service client
// ---------------------------------------------------------------------------

function service(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function login(page: Page, email: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(urlPattern);
}

async function attemptLogin(page: Page, email: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

// ---------------------------------------------------------------------------
// Seed helpers (mirror bookings.spec.ts / payments-admin.spec.ts)
// ---------------------------------------------------------------------------

async function rnRoleId(sb: SupabaseClient) {
  const { data: role } = await sb
    .from("professional_roles")
    .select("id")
    .eq("code", "registered_nurse")
    .single();
  if (!role) throw new Error("registered_nurse role missing");
  return role.id as string;
}

async function seedAdmin(sb: SupabaseClient, stamp: number) {
  const email = `govadmin_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "admin", full_name: "Gov E2E Admin" },
  });
  if (error || !data.user) throw error ?? new Error("admin user");
  // Signup metadata can't grant admin (0031 hardening downgrades it to
  // private_client); promote the trusted service-role-created test admin.
  await sb.from("users").update({ account_type: "admin" }).eq("id", data.user.id);
  return { email, userId: data.user.id };
}

async function seedClient(sb: SupabaseClient, stamp: number) {
  const email = `govclient_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "private_client", full_name: "Gov E2E Client" },
  });
  if (error || !data.user) throw error ?? new Error("client user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: client, error: cErr } = await sb
    .from("private_clients")
    .insert({ user_id: data.user.id, full_name: "Gov E2E Client", stripe_customer_id: "cus_stub_gov" })
    .select("id")
    .single();
  if (cErr || !client) throw cErr ?? new Error("private_clients insert");
  return { email, userId: data.user.id, clientId: client.id as string };
}

type ProSeed = { email: string; userId: string; proId: string; name: string };

async function seedPro(
  sb: SupabaseClient,
  stamp: number,
  roleId: string,
  status: string,
): Promise<ProSeed> {
  const name = `GovPro${stamp}`;
  const email = `govpro_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "professional", full_name: name },
  });
  if (error || !data.user) throw error ?? new Error("pro user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: pro, error: pErr } = await sb
    .from("professionals")
    .insert({
      user_id: data.user.id,
      full_name: name,
      professional_role_id: roleId,
      professional_status: status,
      compliance_status: "approved",
    })
    .select("id, can_accept_bookings")
    .single();
  if (pErr || !pro) throw pErr ?? new Error("professional insert");
  return { email, userId: data.user.id, proId: pro.id as string, name };
}

async function seedEligiblePro(sb: SupabaseClient, stamp: number, roleId: string) {
  const pro = await seedPro(sb, stamp, roleId, "active");
  const { data: row } = await sb
    .from("professionals")
    .select("can_accept_bookings")
    .eq("id", pro.proId)
    .single();
  if (!row?.can_accept_bookings) throw new Error("pro should be eligible");
  return pro;
}

/** Make a professional genuinely compliant — a passed assessment plus every
 *  critical document approved. The reinstate flow re-validates live compliance
 *  before restoring booking ability, so a fixture that only sets
 *  compliance_status='approved' would (correctly) reinstate to booking_restricted. */
async function seedFullCompliance(sb: SupabaseClient, proId: string, roleId: string) {
  await sb.from("assessment_attempts").insert({
    professional_id: proId,
    attempt_number: 1,
    served_question_ids: [],
    score: 100,
    passed: true,
    completed_at: new Date().toISOString(),
  });
  const { data: reqs } = await sb
    .from("compliance_requirements")
    .select("document_type_id, document_types(is_compliance_critical)")
    .eq("professional_role_id", roleId);
  const critical = (reqs ?? [])
    .filter((r) => {
      const dt = r.document_types as unknown as
        | { is_compliance_critical: boolean }
        | { is_compliance_critical: boolean }[]
        | null;
      const docRow = Array.isArray(dt) ? dt[0] : dt;
      return docRow?.is_compliance_critical;
    })
    .map((r) => r.document_type_id);
  const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  for (const typeId of critical) {
    await sb.from("documents").insert({
      professional_id: proId,
      document_type_id: typeId,
      storage_path: `gov/${proId}/${typeId}.pdf`,
      verification_status: "approved",
      expiry_date: expiry,
    });
  }
}

function slot(hoursFromNow: number, durationHours: number) {
  const start = new Date(Date.now() + hoursFromNow * 3_600_000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

async function seedBookingWithSnapshot(
  sb: SupabaseClient,
  opts: {
    requesterUserId: string;
    privateClientId: string;
    professionalRoleId: string;
    locationAddress: string;
  },
) {
  const { startIso, endIso } = slot(48, 4);

  const { data: rateCard, error: rcErr } = await sb
    .from("rate_cards")
    .select("id, client_charge_rate, professional_payout_rate, platform_fee_type, platform_fee_value, currency")
    .eq("professional_role_id", opts.professionalRoleId)
    .is("effective_to", null)
    .single();
  if (rcErr || !rateCard) throw rcErr ?? new Error("rate card missing");

  const insertData = buildBookingInsert(
    {
      requesterUserId: opts.requesterUserId,
      privateClientId: opts.privateClientId,
      professionalRoleId: opts.professionalRoleId,
      scheduledStart: startIso,
      scheduledEnd: endIso,
      locationAddress: opts.locationAddress,
    },
    rateCard as RateCard,
  );

  const { data: booking, error } = await sb
    .from("bookings")
    .insert({ ...insertData, created_by: opts.requesterUserId })
    .select(
      "id, total_client_charge, snap_client_charge_rate, snap_payout_rate, snap_platform_fee, snap_currency",
    )
    .single();
  if (error || !booking) throw error ?? new Error("booking insert");

  await sb.from("booking_status_history").insert({
    booking_id: booking.id,
    to_status: "open",
    changed_by: opts.requesterUserId,
  });

  return booking;
}

async function suspendClientViaAccounts(page: Page, clientEmail: string) {
  await page.goto("/admin/accounts");
  const row = page.locator("tr", { hasText: clientEmail });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await chooseFrom(page, row.getByRole("combobox"), "suspended");
  await row.getByRole("button", { name: /update account status/i }).click();
  await expect(row.locator("td").nth(2)).toContainText("suspended", { timeout: 15_000 });
}

async function cleanupGovernanceTest(
  sb: SupabaseClient,
  ids: {
    proIds?: string[];
    bookingIds?: string[];
    userIds: string[];
  },
) {
  for (const proId of ids.proIds ?? []) {
    await sb.from("professional_status_actions").delete().eq("professional_id", proId);
    await sb.from("professionals").delete().eq("id", proId);
  }
  for (const bookingId of ids.bookingIds ?? []) {
    await sb.from("booking_status_history").delete().eq("booking_id", bookingId);
    await sb.from("bookings").delete().eq("id", bookingId);
  }
  for (const userId of ids.userIds) {
    await sb.from("private_clients").delete().eq("user_id", userId);
    await sb.auth.admin.deleteUser(userId);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("admin suspends and reinstates a professional via UI", async ({ page }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const pro = await seedEligiblePro(sb, stamp, roleId);
  // Reinstate re-validates live compliance, so the pro must be genuinely
  // compliant for reinstate to legitimately restore `active` + booking access.
  await seedFullCompliance(sb, pro.proId, roleId);
  const admin = await seedAdmin(sb, stamp + 1);

  await login(page, admin.email, /\/admin/);
  await page.goto(`/admin/users/${pro.proId}`);

  const statusSection = page.locator("section", { hasText: "Professional status action" });
  await chooseFrom(page, statusSection.getByRole("combobox", { name: "Action" }), "suspend");
  await chooseFrom(page, statusSection.getByRole("combobox", { name: "Reason code" }), "conduct concern");
  await statusSection.getByRole("button", { name: /apply action/i }).click();

  await expect(async () => {
    const { data: afterSuspend } = await sb
      .from("professionals")
      .select("professional_status, can_accept_bookings")
      .eq("id", pro.proId)
      .single();
    expect(afterSuspend?.professional_status).toBe("temporarily_suspended");
    expect(afterSuspend?.can_accept_bookings).toBe(false);
  }).toPass({ timeout: 15_000 });

  const { count: actionCount } = await sb
    .from("professional_status_actions")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", pro.proId)
    .eq("action_type", "suspend");
  expect(actionCount).toBe(1);

  await chooseFrom(page, statusSection.getByRole("combobox", { name: "Action" }), "reinstate");
  await statusSection.getByRole("button", { name: /apply action/i }).click();

  await expect(async () => {
    const { data: afterReinstate } = await sb
      .from("professionals")
      .select("professional_status, can_accept_bookings")
      .eq("id", pro.proId)
      .single();
    expect(afterReinstate?.professional_status).toBe("active");
    expect(afterReinstate?.can_accept_bookings).toBe(true);
  }).toPass({ timeout: 15_000 });

  await cleanupGovernanceTest(sb, {
    proIds: [pro.proId],
    userIds: [pro.userId, admin.userId],
  });
});

test("admin suspends client account and fresh login is blocked", async ({ page, browser }) => {
  const sb = service();
  const stamp = Date.now() + 10;
  const client = await seedClient(sb, stamp);
  const admin = await seedAdmin(sb, stamp + 1);

  await login(page, admin.email, /\/admin/);
  await suspendClientViaAccounts(page, client.email);

  const { data: userRow } = await sb
    .from("users")
    .select("account_status")
    .eq("id", client.userId)
    .single();
  expect(userRow?.account_status).toBe("suspended");

  const clientCtx = await browser.newContext();
  const clientPage = await clientCtx.newPage();
  await attemptLogin(clientPage, client.email);
  await expect(clientPage.getByText(/account is suspended/i)).toBeVisible({ timeout: 15_000 });
  await expect(clientPage).toHaveURL(/\/login/);

  await clientCtx.close();
  await cleanupGovernanceTest(sb, { userIds: [client.userId, admin.userId] });
});

test("guard redirect: logged-in client is sent to /suspended after admin suspends", async ({
  browser,
}) => {
  const sb = service();
  const stamp = Date.now() + 20;
  const client = await seedClient(sb, stamp);
  const admin = await seedAdmin(sb, stamp + 1);

  const clientCtx = await browser.newContext();
  const clientPage = await clientCtx.newPage();
  await login(clientPage, client.email, /\/client/);

  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await login(adminPage, admin.email, /\/admin/);
  await suspendClientViaAccounts(adminPage, client.email);

  await clientPage.goto("/client");
  await expect(clientPage).toHaveURL(/\/suspended/, { timeout: 15_000 });
  await expect(clientPage.getByRole("heading", { name: /account suspended/i })).toBeVisible();

  await clientCtx.close();
  await adminCtx.close();
  await cleanupGovernanceTest(sb, { userIds: [client.userId, admin.userId] });
});

test("admin amends rate card without changing existing booking snapshots", async ({ page }) => {
  const sb = service();
  const stamp = Date.now() + 30;
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const admin = await seedAdmin(sb, stamp + 1);
  const location = `RateAmend ${stamp}`;

  const booking = await seedBookingWithSnapshot(sb, {
    requesterUserId: client.userId,
    privateClientId: client.clientId,
    professionalRoleId: roleId,
    locationAddress: location,
  });

  const frozen = {
    total_client_charge: Number(booking.total_client_charge),
    snap_client_charge_rate: Number(booking.snap_client_charge_rate),
    snap_payout_rate: Number(booking.snap_payout_rate),
    snap_platform_fee: Number(booking.snap_platform_fee),
    snap_currency: booking.snap_currency as string,
  };

  await login(page, admin.email, /\/admin/);
  await page.goto("/admin/rates");

  const rnSection = page.locator("section", { has: page.getByRole("heading", { name: "Registered Nurse" }) });
  await rnSection.getByLabel(/client charge rate/i).fill("45");
  await rnSection.getByLabel(/professional payout rate/i).fill("30");
  await rnSection.getByRole("button", { name: /amend rate card/i }).click();

  await expect(async () => {
    const { data: activeCards, count } = await sb
      .from("rate_cards")
      .select("client_charge_rate, professional_payout_rate", { count: "exact" })
      .eq("professional_role_id", roleId)
      .is("effective_to", null);
    expect(count).toBe(1);
    expect(Number(activeCards![0].client_charge_rate)).toBe(45);
    expect(Number(activeCards![0].professional_payout_rate)).toBe(30);
  }).toPass({ timeout: 15_000 });

  const { data: unchanged } = await sb
    .from("bookings")
    .select("total_client_charge, snap_client_charge_rate, snap_payout_rate, snap_platform_fee, snap_currency")
    .eq("id", booking.id)
    .single();

  expect(Number(unchanged!.total_client_charge)).toBe(frozen.total_client_charge);
  expect(Number(unchanged!.snap_client_charge_rate)).toBe(frozen.snap_client_charge_rate);
  expect(Number(unchanged!.snap_payout_rate)).toBe(frozen.snap_payout_rate);
  expect(Number(unchanged!.snap_platform_fee)).toBe(frozen.snap_platform_fee);
  expect(unchanged!.snap_currency).toBe(frozen.snap_currency);

  // Restore the shared RN rate card to the seeded 40/28 so other tests are not
  // affected by this amendment.
  await sb.rpc("amend_rate_card", {
    p_role_id: roleId,
    p_charge: 40,
    p_payout: 28,
    p_fee_type: "derived",
    p_fee_value: 0,
    p_currency: "GBP",
    p_admin_id: admin.userId,
  });

  await cleanupGovernanceTest(sb, {
    bookingIds: [booking.id],
    userIds: [client.userId, admin.userId],
  });
});

test("admin user search filters by professionalStatus", async ({ page }) => {
  const sb = service();
  const stamp = Date.now() + 40;
  const roleId = await rnRoleId(sb);
  const activePro = await seedPro(sb, stamp, roleId, "active");
  const suspendedPro = await seedPro(sb, stamp + 1, roleId, "temporarily_suspended");
  const admin = await seedAdmin(sb, stamp + 2);

  await login(page, admin.email, /\/admin/);
  await page.goto("/admin/users?professionalStatus=temporarily_suspended");

  await expect(page.locator("tr", { hasText: suspendedPro.name })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("tr", { hasText: activePro.name })).toHaveCount(0);

  await cleanupGovernanceTest(sb, {
    proIds: [activePro.proId, suspendedPro.proId],
    userIds: [activePro.userId, suspendedPro.userId, admin.userId],
  });
});
