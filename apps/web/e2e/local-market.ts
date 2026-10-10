import { createClient } from "@supabase/supabase-js";

/** Refuse hosted targets before test helpers can create accounts or alter policy. */
export function localService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname)) {
    throw new Error("E2E mutations require a local Supabase target.");
  }
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

export async function openPortugalForSuite(): Promise<boolean> {
  const sb = localService();
  const { data, error } = await sb.from("countries").select("is_live").eq("code", "PT").single();
  if (error) throw error;
  const { error: updateError } = await sb.from("countries").update({ is_live: true }).eq("code", "PT");
  if (updateError) throw updateError;
  return data.is_live;
}

export async function restorePortugalAfterSuite(wasLive: boolean) {
  const { error } = await localService().from("countries").update({ is_live: wasLive }).eq("code", "PT");
  if (error) throw error;
}
