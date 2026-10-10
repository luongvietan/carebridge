"use server";
import { revalidatePath } from "next/cache";
import { isGateEnabled } from "@/lib/auth/gate";
import { createClient } from "@/lib/supabase/server";
import { isMarketOpen, type MarketCountry } from "@/lib/marketing/market";
import { persistMarketCookie } from "@/lib/marketing/market-cookie";

/**
 * Choose a market from the homepage switch (client request, 10 Aug).
 *
 * Only Portugal can open for this launch, publicly after approval or privately
 * behind the gate. UK stays launching soon regardless of an old database flag.
 */
export async function selectMarket(code: string): Promise<{ ok: boolean }> {
  if (!/^[A-Z]{2}$/.test(code)) return { ok: false };

  const supabase = await createClient();
  const { data: country } = await supabase
    .from("countries")
    .select("code, is_live")
    .eq("code", code)
    .maybeSingle();
  if (!country) return { ok: false };
  // Private preview: behind the access gate a not-yet-live market can be
  // chosen, so the client can review it before launch. Public: live only.
  if (!isMarketOpen(country.code, country.is_live, isGateEnabled())) return { ok: false };

  await persistMarketCookie(code as MarketCountry);
  revalidatePath("/");
  return { ok: true };
}
