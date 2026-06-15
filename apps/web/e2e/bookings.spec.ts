import { test, expect, type Page, type Browser } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildBookingInsert } from "../src/lib/bookings/create";
import type { RateCard } from "../src/lib/rates/snapshot";

const PASSWORD = "password123";

function service(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function slot(hoursFromNow: number, durationHours: number) {
  const start = new Date(Date.now() + hoursFromNow * 3_600_000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  return { start, end, startIso: start.toISOString(), endIso: end.toISOString() };
}

async function login(page: Page, email: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(urlPattern);
}

async function rnRoleId(sb: SupabaseClient) {
  const { data: role } = await sb.from("professional_roles").select("id").eq("code", "registered_nurse").single();
  if (!role) throw new Error("registered_nurse role missing");
  return role.id as string;
}

async function seedAdmin(sb: SupabaseClient, stamp: number) {
  const email = `bkadmin_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "admin", full_name: "E2E Admin" },
  });
  if (error || !data.user) throw error ?? new Error("admin user");
  return { email, userId: data.user.id };
}

async function seedClient(sb: SupabaseClient, stamp: number) {
  const email = `bkclient_${stamp}@test.dev`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { account_type: "private_client", full_name: "E2E Client" },
  });
  if (error || !data.user) throw error ?? new Error("client user");
  await new Promise((r) => setTimeout(r, 800));
  const { data: client, error: cErr } = await sb
    .from("private_clients")
    .insert({ user_id: data.user.id, full_name: "E2E Client", stripe_customer_id: "cus_stub_e2e" })
    .select("id")
    .single();
  if (cErr || !client) throw cErr ?? new Error("private_clients insert");
  return { email, userId: data.user.id, clientId: client.id as string };
}

type ProSeed = { email: string; userId: string; proId: string; name: string };

async function seedEligiblePro(sb: SupabaseClient, stamp: number, roleId: string): Promise<ProSeed> {
  const name = `EligiblePro${stamp}`;
  const email = `bkpro_${stamp}@test.dev`;
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

async function fillBookingForm(page: Page, location: string, start: Date, end: Date) {
  await page.locator('select[name="professionalRoleId"]').selectOption({ label: "Registered Nurse" });
  await page.locator('input[name="scheduledStart"]').fill(toDatetimeLocal(start));
  await page.locator('input[name="scheduledEnd"]').fill(toDatetimeLocal(end));
  await page.locator('input[name="locationAddress"]').fill(location);
  await page.locator('input[name="locationPostcode"]').fill("E1 6AN");
}

test("open-market happy path: client creates booking, professional accepts", async ({ page, browser }) => {
  const sb = service();
  const stamp = Date.now();
  const roleId = await rnRoleId(sb);
  const client = await seedClient(sb, stamp);
  const pro = await seedEligiblePro(sb, stamp + 1, roleId);
  const location = `OpenMarket ${stamp}`;
  const durationHours = 4;

  await login(page, client.email, /\/client/);
  await page.goto("/client/bookings/new");
  const { start, end, startIso: happyStartIso } = slot(48, durationHours);
  await fillBookingForm(page, location, start, end);
  await page.getByRole("button", { name: /create booking/i }).click();
  await expect(page).toHaveURL(/\/client\/bookings/);
  await expect(page.locator("tr", { hasText: formatDate(happyStartIso) })).toBeVisible();

  const { data: created } = await sb
    .from("bookings")
    .select("id, status, duration_hours, total_client_charge, total_payout")
    .eq("location_address", location)
    .single();
  expect(created?.status).toBe("open");
  const expectedCharge = Math.round(Number(created!.duration_hours) * 40 * 100) / 100;
  const expectedPayout = Math.round(Number(created!.duration_hours) * 28 * 100) / 100;
  expect(Number(created!.total_client_charge)).toBe(expectedCharge);
  expect(Number(created!.total_payout)).toBe(expectedPayout);

  const proCtx = await browser.newContext();
  const proPage = await proCtx.newPage();
  await login(proPage, pro.email, /\/professional/);
  await proPage.goto("/professional/bookings");
  const row = proPage.locator("tr", { hasText: location });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /^accept$/i }).click();
  await expect(row.getByText(/accepted/i)).toBeVisible({ timeout: 15_000 });

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
  await row.locator("select").selectOption({ label: pro.name });
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
  await row.locator("select").selectOption({ label: pro.name });

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
  await expect(row).toBeHidden({ timeout: 15_000 });

  const { count } = await sb
    .from("booking_declines")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", booking.id)
    .eq("professional_id", pro.proId);
  expect(count).toBe(1);

  await proPage.reload();
  await expect(proPage.locator("tr", { hasText: location })).toHaveCount(0);
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

  page.on("dialog", (d) => d.accept());
  await login(page, client.email, /\/client/);
  await page.goto("/client/bookings");
  const cancelTr = page.locator("tr", { hasText: formatDate(startIso) });
  await cancelTr.getByRole("button", { name: /^cancel$/i }).click();
  await expect(cancelTr.getByText(/cancelled/i)).toBeVisible({ timeout: 15_000 });

  const { data: cancelRow } = await sb
    .from("booking_cancellations")
    .select("is_last_minute")
    .eq("booking_id", booking.id)
    .single();
  expect(cancelRow?.is_last_minute).toBe(true);
});
