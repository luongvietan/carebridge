/**
 * One-time sign-in links for the demo accounts.
 *
 * Passwords for the QA accounts are not stored anywhere, so this mints a
 * magiclink token per account with the service role and prints the /auth/confirm
 * URL that redeems it — the same gate-exempt route capture-userflow.mjs uses.
 * Open a link in the browser and that account is signed in; nothing is typed
 * into a form and no password is created or revealed.
 *
 * Each link is single-use and expires (Supabase OTP lifetime, an hour by
 * default), so re-run this right before you need it.
 *
 *   node scripts/demo-signin-links.mjs                 # all demo accounts
 *   node scripts/demo-signin-links.mjs nanny client    # only these
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, i), v];
    }),
);

const BASE = env.NEXT_PUBLIC_APP_URL ?? "https://www.carebridgeconnect.co.uk";

const ACCOUNTS = {
  nanny: { email: "bepewon753@fishnone.com", next: "/professional", who: "Grace Whitfield — Nanny (Ofsted EY123456)" },
  client: { email: "cetire4490@epaynine.com", next: "/client", who: "Emily Hartley — private client" },
  nurse: { email: "delin28712@epaynine.com", next: "/professional", who: "Delin Nguyen — Registered Nurse" },
  admin: { email: "luongvietan.231123@gmail.com", next: "/admin", who: "Founder / administrator" },
};

async function tokenFor(email) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  if (!res.ok) throw new Error(`generate_link failed for ${email}: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const hashed = body?.properties?.hashed_token ?? body?.hashed_token;
  if (!hashed) throw new Error(`no hashed_token returned for ${email}`);
  return hashed;
}

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ACCOUNTS);

for (const key of wanted) {
  const account = ACCOUNTS[key];
  if (!account) {
    console.error(`unknown account "${key}" — one of: ${Object.keys(ACCOUNTS).join(", ")}`);
    continue;
  }
  const url = new URL("/auth/confirm", BASE);
  url.searchParams.set("token_hash", await tokenFor(account.email));
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", account.next);
  console.log(`\n${key.padEnd(7)} ${account.who}\n        ${account.email}\n        ${url}`);
}
console.log("\nSingle use, expires within the hour. Enter the /gate code first if the browser has no gate cookie.\n");
