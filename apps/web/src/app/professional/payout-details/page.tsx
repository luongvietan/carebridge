import { getPreferredLocale } from "@/lib/i18n/preference-server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PayoutDetailsForm } from "@/components/payout-details-form";
import { getAccountCountry } from "@/lib/accounts/market-server";
export const dynamic = "force-dynamic";

export default async function PayoutDetailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let last4: string | null = null;
  if (user) {
    const admin = createServiceClient();
    const { data: prof } = await admin
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (prof) {
      const { data } = await admin.rpc("get_payout_last4", {
        p_professional_id: prof.id,
      });
      last4 = (data as string | null) ?? null;
    }
  }
  const pt = (await getAccountCountry()) === "PT";
  const locale = await getPreferredLocale();
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">{locale === "pt-PT" ? "Dados de pagamento" : "Payout details"}</h1>
      <PayoutDetailsForm
        last4={last4}
        defaultKind={pt ? "iban" : "uk"}
        locale={locale}
      />
    </main>
  );
}
