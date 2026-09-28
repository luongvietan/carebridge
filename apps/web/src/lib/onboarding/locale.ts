import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSelectedCountry } from "@/lib/marketing/market-server";
import type { OnboardingLocale } from "@/lib/onboarding/copy";

/**
 * The language of a professional's onboarding: their own country once they have
 * a row (it decides their roles, documents and assessment), the market they are
 * browsing from before that.
 */
export async function getOnboardingLocale(): Promise<OnboardingLocale> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from("professionals")
      .select("country_code")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.country_code) return data.country_code === "PT" ? "pt-PT" : "en-GB";
  }
  return (await getSelectedCountry()) === "PT" ? "pt-PT" : "en-GB";
}
