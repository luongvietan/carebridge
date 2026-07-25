/**
 * Capture annotated screen-flow screenshots from the live site.
 *
 * Auth strategy (no passwords used anywhere):
 *  - Private-preview gate: the cookie value is HMAC-SHA256(PRODUCTION_GATE_SECRET, salt),
 *    computed here and injected directly, mirroring lib/auth/gate.ts.
 *  - Sign-in: an admin-generated magiclink token_hash is redeemed via /auth/confirm,
 *    which is gate-exempt. Credentials are never typed into a form.
 *
 * Usage:  node scripts/capture-userflow.mjs [--base https://www.carebridgeconnect.co.uk]
 */
import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(APP_ROOT, "../..");
const OUT_ROOT = join(REPO_ROOT, "demo-kit", "userflow");

const GATE_COOKIE_NAME = "cbc_site_access";
const GATE_TOKEN_SALT = "cbc-site-access-v1";

/* ---------------------------------------------------------------- env ---- */

async function loadEnv(path) {
  const raw = await readFile(path, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/* --------------------------------------------------------------- auth ---- */

async function magicTokenFor(env, email) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  if (!res.ok) {
    throw new Error(`generate_link failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  const hashed = body?.properties?.hashed_token ?? body?.hashed_token;
  if (!hashed) throw new Error(`no hashed_token returned for ${email}`);
  return hashed;
}

/* ------------------------------------------------------------- capture --- */

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

async function shoot(page, outDir, index, name, path, base, note) {
  const target = new URL(path, base).toString();
  await page.goto(target, { waitUntil: "networkidle", timeout: 45_000 }).catch(() => {});
  // Settle GSAP/Lenis scroll reveals so nothing is captured mid-animation.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(500);

  const file = join(outDir, `${String(index).padStart(2, "0")}-${slug(name)}.png`);
  await page.screenshot({ path: file, fullPage: true });

  const landed = new URL(page.url()).pathname;
  const requested = new URL(target).pathname;
  const redirected = landed !== requested;
  console.log(
    `  ${String(index).padStart(2, "0")} ${name.padEnd(34)} ${requested}${redirected ? `  →  ${landed}` : ""}`,
  );
  return { index, name, requested, landed, redirected, note, file };
}

/* ---------------------------------------------------------------- plan --- */

const PUBLIC_SCREENS = [
  ["Homepage", "/"],
  ["About Us", "/about"],
  ["Professional roles", "/services"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
  ["Register - choose account type", "/register"],
  ["Register - professional", "/register?as=professional"],
  ["Register - client or organisation", "/register?as=client"],
  ["Sign in", "/login"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
];

const PERSONAS = [
  {
    // A brand-new applicant: shows the very start of the journey.
    key: "01_professional_new",
    dir: "01_professional",
    startIndex: 1,
    label: "Professional (new applicant)",
    envKey: "SHOT_PROFESSIONAL_EMAIL",
    home: "/professional",
    screens: [
      ["Professional dashboard", "/professional"],
      ["Onboarding 1 - eligibility", "/professional/onboarding/eligibility"],
    ],
  },
  {
    // An applicant already part-way through: the later steps render with real data.
    key: "01_professional_progressed",
    dir: "01_professional",
    startIndex: 3,
    label: "Professional (part-way through)",
    envKey: "SHOT_PROFESSIONAL2_EMAIL",
    home: "/professional",
    screens: [
      ["Onboarding 2 - assessment", "/professional/onboarding/assessment"],
      ["Assessment certificate", "/professional/onboarding/assessment/certificate"],
      ["Onboarding 3 - profile", "/professional/onboarding/profile"],
      ["Onboarding 4 - documents", "/professional/onboarding/documents"],
      ["Bookings - open shifts", "/professional/bookings"],
      ["Earnings", "/professional/earnings"],
      ["Payout details", "/professional/payout-details"],
    ],
  },
  {
    key: "02_private_client",
    label: "Private client (family)",
    envKey: "SHOT_CLIENT_EMAIL",
    home: "/client",
    screens: [
      ["Client dashboard", "/client"],
      ["Register your profile", "/client/register"],
      ["New booking", "/client/bookings/new"],
      ["Your bookings", "/client/bookings"],
    ],
  },
  {
    key: "03_organisation",
    label: "Organisation",
    envKey: "SHOT_ORGANISATION_EMAIL",
    home: "/organisation",
    screens: [
      ["Organisation dashboard", "/organisation"],
      ["Register organisation", "/organisation/register"],
      ["New booking", "/organisation/bookings/new"],
      ["Organisation bookings", "/organisation/bookings"],
    ],
  },
  {
    key: "04_admin",
    label: "Admin",
    envKey: "SHOT_ADMIN_EMAIL",
    home: "/admin",
    screens: [
      ["Admin dashboard", "/admin"],
      ["Compliance review queue", "/admin/compliance"],
      ["Bookings pipeline", "/admin/bookings"],
      ["Professionals", "/admin/users"],
      ["All accounts", "/admin/accounts"],
      ["Rate cards", "/admin/rates"],
      ["Finance", "/admin/finance"],
      ["Payouts", "/admin/finance/payouts"],
      ["Reports and exports", "/admin/reports"],
      ["Audit log", "/admin/audit"],
    ],
  },
];

/* ---------------------------------------------------------------- main --- */

const baseArg = process.argv.indexOf("--base");
const BASE = baseArg !== -1 ? process.argv[baseArg + 1] : "https://www.carebridgeconnect.co.uk";

const env = {
  ...(await loadEnv(join(APP_ROOT, ".env.local"))),
  ...process.env,
};

for (const required of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!env[required]) throw new Error(`Missing ${required} in apps/web/.env.local`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});

// Private-preview gate — inject the cookie rather than typing the access code.
if (env.PRODUCTION_GATE_SECRET) {
  const token = createHmac("sha256", env.PRODUCTION_GATE_SECRET)
    .update(GATE_TOKEN_SALT)
    .digest("hex");
  await context.addCookies([
    {
      name: GATE_COOKIE_NAME,
      value: token,
      domain: new URL(BASE).hostname,
      path: "/",
      httpOnly: true,
      secure: BASE.startsWith("https"),
      sameSite: "Lax",
    },
  ]);
  console.log("gate cookie injected\n");
}

const manifest = { base: BASE, capturedAt: new Date().toISOString(), sections: [] };
const page = await context.newPage();

console.log(`Public pages  →  ${BASE}`);
const publicDir = join(OUT_ROOT, "00_public");
await mkdir(publicDir, { recursive: true });
const publicShots = [];
let i = 1;
for (const [name, path] of PUBLIC_SCREENS) {
  publicShots.push(await shoot(page, publicDir, i++, name, path, BASE));
}
manifest.sections.push({ key: "00_public", label: "Public site", shots: publicShots });

for (const persona of PERSONAS) {
  const email = env[persona.envKey];
  if (!email) {
    console.log(`\n${persona.label}: skipped (set ${persona.envKey})`);
    continue;
  }
  console.log(`\n${persona.label}  <${email}>`);

  let token;
  try {
    token = await magicTokenFor(env, email);
  } catch (err) {
    console.log(`  !! ${err.message}`);
    continue;
  }

  const confirm = new URL("/auth/confirm", BASE);
  confirm.searchParams.set("token_hash", token);
  confirm.searchParams.set("type", "magiclink");
  confirm.searchParams.set("next", persona.home);
  await page.goto(confirm.toString(), { waitUntil: "networkidle", timeout: 45_000 });

  const landedAfterAuth = new URL(page.url()).pathname;
  if (landedAfterAuth.startsWith("/login")) {
    console.log(`  !! sign-in failed (landed on ${landedAfterAuth}) — skipping persona`);
    continue;
  }

  const dir = join(OUT_ROOT, persona.dir ?? persona.key);
  await mkdir(dir, { recursive: true });
  const shots = [];
  let n = persona.startIndex ?? 1;
  for (const [name, path] of persona.screens) {
    shots.push(await shoot(page, dir, n++, name, path, BASE));
  }
  manifest.sections.push({
    key: persona.key,
    dir: persona.dir ?? persona.key,
    label: persona.label,
    email,
    shots,
  });

  await context.clearCookies({ name: "sb-access-token" }).catch(() => {});
  await page.goto(new URL("/", BASE).toString()).catch(() => {});
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
  await context.clearCookies({ domain: new URL(BASE).hostname }).catch(() => {});
  // Re-inject the gate cookie, which clearCookies just removed.
  if (env.PRODUCTION_GATE_SECRET) {
    const token2 = createHmac("sha256", env.PRODUCTION_GATE_SECRET)
      .update(GATE_TOKEN_SALT)
      .digest("hex");
    await context.addCookies([
      {
        name: GATE_COOKIE_NAME,
        value: token2,
        domain: new URL(BASE).hostname,
        path: "/",
        httpOnly: true,
        secure: BASE.startsWith("https"),
        sameSite: "Lax",
      },
    ]);
  }
}

await writeFile(join(OUT_ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`\nDone → ${OUT_ROOT}`);
