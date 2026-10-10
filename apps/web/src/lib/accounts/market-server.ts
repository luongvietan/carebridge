import "server-only";
import type { User } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import type { MarketCountry } from "@/lib/marketing/market";

/** Only tolerate the known pre-0091 users snapshot-column mismatch. */
function missingSignupCountryColumn(error: { code: string; message: string }): boolean {
  if (error.code === "42703") {
    return /^column users\.country_code does not exist\.?$/i.test(error.message.replaceAll('"', ""));
  }
  return error.code === "PGRST204" &&
    /^Could not find the ['"]country_code['"] column of ['"]users['"] in the schema cache\.?$/i.test(error.message);
}

/** Immutable signup snapshot wins; historical profile is a legacy fallback. */
export async function getAccountCountry(sessionUser?: User): Promise<MarketCountry> {
  const user = sessionUser ?? await getAuthUser();
  if (!user) return getSelectedCountry();
  const admin = createServiceClient();
  let { data: account, error: accountError } = await admin.from("users").select("account_type, country_code").eq("id", user.id).maybeSingle();
  if (accountError && missingSignupCountryColumn(accountError)) {
    const legacy = await admin.from("users").select("account_type").eq("id", user.id).maybeSingle();
    account = legacy.data ? { ...legacy.data, country_code: null } : null;
    accountError = legacy.error;
  }
  if (accountError) throw new Error("Could not determine account country.");
  if (account?.country_code === "PT" || account?.country_code === "GB") return account.country_code;
  const table = account?.account_type === "professional" ? "professionals" : account?.account_type === "organisation" ? "organisations" : null;
  if (table) {
    const { data: profile, error } = await admin.from(table).select("country_code").eq("user_id", user.id).maybeSingle();
    if (error) throw new Error("Could not determine account country.");
    if (profile?.country_code === "PT" || profile?.country_code === "GB") return profile.country_code;
  }
  return "GB";
}
