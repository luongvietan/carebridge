"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MARKET_COOKIE, type MarketCountry } from "@/lib/marketing/market";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Choose a market from the homepage switch (client request, 10 Aug).
 *
 * A market can only be selected while it is live in the database — Portugal
 * stays a "launching soon" badge until Ana's regulatory confirmation arrives,
 * and going live is then one `update countries set is_live = true` away, with
 * no code change. The cookie stores only the two-letter code, so a tampered
 * value degrades to the home market rather than to anything attacker-chosen.
 */
export async function selectMarket(code: string): Promise<{ ok: boolean }> {
  if (!/^[A-Z]{2}$/.test(code)) return { ok: false };

  const supabase = await createClient();
  const { data: country } = await supabase
    .from("countries")
    .select("code, is_live")
    .eq("code", code)
    .maybeSingle();
  if (!country?.is_live) return { ok: false };

  const store = await cookies();
  store.set(MARKET_COOKIE, code as MarketCountry, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  revalidatePath("/");
  return { ok: true };
}
