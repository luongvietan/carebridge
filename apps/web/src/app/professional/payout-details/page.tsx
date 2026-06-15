import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PayoutDetailsForm } from "@/components/payout-details-form";
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
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-light">Payout details</h1>
      <PayoutDetailsForm last4={last4} />
    </main>
  );
}
