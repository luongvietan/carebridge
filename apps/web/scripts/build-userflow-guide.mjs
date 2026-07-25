/**
 * Build demo-kit/userflow/index.html from manifest.json + the step notes below.
 * Re-run after capture-userflow.mjs to regenerate the guide.
 *
 * Usage:  node scripts/build-userflow-guide.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(__dirname, "../../../demo-kit/userflow");

/** Step notes, keyed by "<section key>/<screenshot name>". */
const NOTES = {
  "00_public/Homepage":
    "The public landing page. Visitors are routed either to request care or to join as a professional. The hero copy and the statistics band are the first things a family sees.",
  "00_public/About Us": "Background on CareBridge Connect and how the vetting model works.",
  "00_public/Professional roles":
    "The public list of roles the marketplace supplies. This is the page that will gain the new Childcare Professionals category.",
  "00_public/FAQ": "Common questions for both families and professionals.",
  "00_public/Contact":
    "Enquiry form. Submissions are stored on the platform and are visible to administrators — nothing is lost in a personal inbox.",
  "00_public/Register - choose account type":
    "The first step of signing up. Visitors choose between joining as a professional or requesting care as a family or organisation.",
  "00_public/Register - professional":
    "Professional sign-up. This only creates the login — eligibility, assessment, profile and documents follow in the onboarding wizard.",
  "00_public/Register - client or organisation":
    "Client sign-up. The radio button decides whether the account becomes a private client (family) or an organisation.",
  "00_public/Sign in":
    "Single sign-in for every account type. After signing in, each user is sent to their own area automatically.",
  "00_public/Terms": "Separate terms for clients and for professionals.",
  "00_public/Privacy": "Privacy policy and data-handling statement.",

  "01_professional/Professional dashboard":
    "What a professional sees immediately after their first sign-in. Nothing can be done until onboarding is complete.",
  "01_professional/Onboarding 1 - eligibility":
    "Step 1 of 4. Employment status plus the mandatory training declarations. The four-step bar at the top tracks progress throughout.",
  "01_professional/Onboarding 2 - assessment":
    "Step 2 of 4. A competency assessment with an 80% pass mark and a maximum of three attempts.",
  "01_professional/Assessment certificate":
    "A printable certificate is issued once the assessment is passed.",
  "01_professional/Onboarding 3 - profile":
    "Step 3 of 4. Role selection, personal and address details, professional body registration, skills and weekly availability. This is where the Ofsted registration number will become a mandatory field for nannies.",
  "01_professional/Onboarding 4 - documents":
    "Step 4 of 4. Each required document is uploaded here. Documents marked critical must be approved by an administrator before the professional can accept any bookings. The Ofsted registration certificate will be added to this list for nannies.",
  "01_professional/Bookings - open shifts":
    "Open shifts matching the professional's role, plus assignments already accepted. Shifts only appear once the account is verified and active.",
  "01_professional/Earnings": "Payouts recorded against each completed booking.",
  "01_professional/Payout details":
    "Bank details for payouts. These are stored encrypted.",

  "02_private_client/Client dashboard": "The family's home screen after signing in.",
  "02_private_client/Register your profile":
    "Address, billing and care details. This must be completed before a booking can be made.",
  "02_private_client/New booking":
    "Creating a booking request: the role required, start date and time, duration, and the address where care is needed. The price is calculated from the rate card for that role.",
  "02_private_client/Your bookings":
    "All bookings with their current status, together with payment and cancellation controls.",

  "03_organisation/Organisation dashboard": "The organisation's home screen.",
  "03_organisation/Register organisation":
    "Organisation name, address, contacts and billing details — required before booking.",
  "03_organisation/New booking":
    "The same booking form as for families, used by care homes and agencies booking cover shifts.",
  "03_organisation/Organisation bookings": "All shifts the organisation has requested.",

  "04_admin/Admin dashboard": "The administrator's overview of the whole platform.",
  "04_admin/Compliance review queue":
    "The heart of the vetting process. Each uploaded document is approved or rejected here. When the last critical document is approved, the professional is activated automatically and can start accepting bookings. This is where Ofsted registration certificates will be verified.",
  "04_admin/Bookings pipeline":
    "Every booking on the platform, with the ability to assign a professional directly to an open shift.",
  "04_admin/Professionals":
    "Searchable list of professionals, filterable by status, compliance state, role, DBS and availability.",
  "04_admin/All accounts": "Every account on the platform, across all four account types.",
  "04_admin/Rate cards":
    "Charge and payout rates per role. Amendments apply forward only — bookings already made keep the rate they were created with.",
  "04_admin/Finance": "Payments received and platform revenue.",
  "04_admin/Payouts": "Recording payouts to professionals and marking them as paid.",
  "04_admin/Reports and exports": "CSV and Excel exports for each dataset.",
  "04_admin/Audit log":
    "A complete record of administrative actions, filterable by date, entity and actor.",
};

/** Section-level intros. */
const INTROS = {
  "00_public": "What any visitor sees before signing in.",
  "01_professional":
    "How a carer joins the platform and gets verified. Steps 1–2 are shown from a brand-new account; steps 3 onwards from an account already part-way through, so the screens show real content.",
  "02_private_client": "How a family registers and books care.",
  "03_organisation": "How a care home or agency books cover shifts.",
  "04_admin": "How the platform is run and how professionals are verified.",
};

const SECTION_TITLES = {
  "00_public": "1. The public site",
  "01_professional": "2. Professional journey",
  "02_private_client": "3. Family journey",
  "03_organisation": "4. Organisation journey",
  "04_admin": "5. Administrator journey",
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const manifest = JSON.parse(await readFile(join(OUT_ROOT, "manifest.json"), "utf8"));

// Merge sections that share an output folder (the two professional personas).
const merged = new Map();
for (const section of manifest.sections) {
  const dir = section.dir ?? section.key;
  if (!merged.has(dir)) merged.set(dir, { dir, label: section.label, shots: [] });
  merged.get(dir).shots.push(...section.shots);
}
for (const section of merged.values()) section.shots.sort((a, b) => a.index - b.index);

const sections = [...merged.values()];

const toc = sections
  .map((s) => `<li><a href="#${s.dir}">${esc(SECTION_TITLES[s.dir] ?? s.label)}</a></li>`)
  .join("\n");

const body = sections
  .map((section) => {
    const steps = section.shots
      .map((shot) => {
        const note = NOTES[`${section.dir}/${shot.name}`] ?? "";
        const src = relative(OUT_ROOT, shot.file).split("\\").join("/");
        return `
      <section class="step">
        <div class="step-head">
          <span class="num">${String(shot.index).padStart(2, "0")}</span>
          <div>
            <h3>${esc(shot.name)}</h3>
            <code>${esc(shot.landed)}</code>
          </div>
        </div>
        ${note ? `<p class="note">${esc(note)}</p>` : ""}
        <figure><img src="${esc(src)}" alt="${esc(shot.name)}" loading="lazy" /></figure>
      </section>`;
      })
      .join("\n");

    return `
    <div class="chapter" id="${section.dir}">
      <h2>${esc(SECTION_TITLES[section.dir] ?? section.label)}</h2>
      ${INTROS[section.dir] ? `<p class="intro">${esc(INTROS[section.dir])}</p>` : ""}
      ${steps}
    </div>`;
  })
  .join("\n");

const captured = new Date(manifest.capturedAt).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CareBridge Connect — Platform Walkthrough</title>
<style>
  :root {
    --green: #1e5a33;
    --green-mid: #2e7d32;
    --ink: #1c211e;
    --muted: #5b6660;
    --line: #dfe5e1;
    --bg: #f7f9f8;
    --card: #ffffff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px 96px; }
  header.hero {
    background: linear-gradient(160deg, var(--green) 0%, #14401f 100%);
    color: #fff;
    padding: 56px 24px 48px;
    margin-bottom: 40px;
  }
  header.hero .wrap { padding-bottom: 0; }
  header.hero h1 { margin: 0 0 12px; font-size: clamp(28px, 4vw, 40px); letter-spacing: -0.02em; }
  header.hero p { margin: 0; max-width: 62ch; color: #d8e8dc; }
  header.hero .meta { margin-top: 20px; font-size: 14px; color: #a9c9b3; }
  nav.toc {
    background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 20px 24px; margin-bottom: 48px;
  }
  nav.toc h2 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase;
    letter-spacing: 0.09em; color: var(--muted); }
  nav.toc ol { margin: 0; padding: 0; list-style: none; }
  nav.toc li { margin: 5px 0; }
  nav.toc a { color: var(--green-mid); text-decoration: none; font-weight: 600; }
  nav.toc a:hover { text-decoration: underline; }
  .chapter { margin-bottom: 72px; scroll-margin-top: 20px; }
  .chapter > h2 {
    font-size: 24px; color: var(--green); margin: 0 0 6px;
    padding-bottom: 12px; border-bottom: 2px solid var(--line);
  }
  .chapter > .intro { color: var(--muted); margin: 12px 0 32px; max-width: 70ch; }
  .step {
    background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 22px; margin-bottom: 22px;
  }
  .step-head { display: flex; gap: 14px; align-items: flex-start; }
  .num {
    flex: none; width: 34px; height: 34px; border-radius: 9px;
    background: var(--green); color: #fff; font-weight: 700; font-size: 14px;
    display: grid; place-items: center;
  }
  .step h3 { margin: 4px 0 2px; font-size: 17px; }
  .step code { font-size: 13px; color: var(--muted); }
  .note { margin: 14px 0 0; max-width: 74ch; }
  figure { margin: 18px 0 0; }
  figure img {
    display: block; width: 100%; height: auto;
    border: 1px solid var(--line); border-radius: 10px;
  }
  footer { color: var(--muted); font-size: 14px; border-top: 1px solid var(--line); padding-top: 24px; }
  @media print {
    body { background: #fff; }
    header.hero { background: #fff; color: var(--ink); padding-top: 0; }
    header.hero p, header.hero .meta { color: var(--muted); }
    nav.toc { display: none; }
    .step { break-inside: avoid; border-color: #ccc; }
  }
</style>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <h1>CareBridge Connect — Platform Walkthrough</h1>
    <p>A step-by-step tour of the live platform, showing what each type of user sees and does. Every screen below is a real screenshot of the site.</p>
    <div class="meta">Captured ${esc(captured)} · ${esc(manifest.base)}</div>
  </div>
</header>

<div class="wrap">
  <nav class="toc">
    <h2>Contents</h2>
    <ol>
${toc}
    </ol>
  </nav>

${body}

  <footer>
    <p>CareBridge Connect · internal walkthrough document</p>
  </footer>
</div>
</body>
</html>
`;

await writeFile(join(OUT_ROOT, "index.html"), html);
console.log(`Guide written → ${join(OUT_ROOT, "index.html")}`);
console.log(`${sections.length} sections, ${sections.reduce((n, s) => n + s.shots.length, 0)} steps`);
