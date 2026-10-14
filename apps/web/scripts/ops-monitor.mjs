import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export function parseOrigin(value) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      !(url.protocol === "https:" || (local && url.protocol === "http:"))) {
    throw new Error("Use an HTTPS origin without credentials, path, query or fragment (HTTP is allowed locally).");
  }
  return url.origin;
}

/** GET only. Never invoke cron, send mail, submit forms or print response bodies. */
export async function checkPage(origin, path, request = fetch) {
  const started = Date.now();
  let gated = false;
  try {
    const signal = globalThis.AbortSignal.timeout(15_000);
    let response = await request(new URL(path, origin), { redirect: "manual", signal });
    if ([302, 303, 307, 308].includes(response.status)) {
      const target = new URL(response.headers.get("location") ?? "", origin);
      if (target.origin !== origin || target.pathname !== "/gate") {
        return { path, ok: false, reason: "unexpected_redirect" };
      }
      gated = true;
      response = await request(target, { redirect: "manual", signal });
    }
    const html = response.headers.get("content-type")?.includes("text/html");
    const body = response.status === 200 && html ? await response.text() : "";
    return { path, ok: response.status === 200 && !!html && /<html[\s>]/i.test(body), status: response.status, gated, duration_ms: Date.now() - started };
  } catch {
    return { path, ok: false, reason: "request_failed", duration_ms: Date.now() - started };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const originIndex = args.indexOf("--origin");
  let origin;
  try {
    origin = parseOrigin(originIndex >= 0 ? args[originIndex + 1] : process.env.OPS_APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL);
  } catch {
    console.error("Set OPS_APP_ORIGIN or pass --origin with a valid HTTPS origin; HTTP is allowed for localhost.");
    process.exitCode = 1;
    return;
  }
  const pages = await Promise.all(["/", "/login", "/register"].map(path => checkPage(origin, path)));
  let database = { ok: false, reason: "not_configured" };
  if (args.includes("--http-only")) {
    database = { assessed: false, reason: "http_only_requested" };
  } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
        global: { fetch: (url, options) => fetch(url, { ...options, signal: globalThis.AbortSignal.timeout(15_000) }) },
      });
      const { data, error } = await db.from("countries").select("code").eq("code", "PT").maybeSingle();
      database = { ok: !error && data?.code === "PT" };
    } catch {
      database = { ok: false, reason: "query_failed" };
    }
  }
  const ok = pages.every(page => page.ok) && (args.includes("--http-only") || database.ok);
  console.log(JSON.stringify({ checked_at: new Date().toISOString(), ok, pages, database }, null, 2));
  if (!ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
