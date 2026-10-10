import { AccountRegisterForm } from "@/components/account-register-form";
import { getAccountCountry } from "@/lib/accounts/market-server";
import { getAuthUser } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { CLIENT_PROFILE_COLUMNS, clientFormValues } from "@/lib/accounts/profile-values";

/** The saved profile for the signed-in user (the table has no owner-read policy). */
async function savedProfile() {
  const user = await getAuthUser();
  if (!user) return undefined;
  const { data } = await createServiceClient()
    .from("private_clients")
    .select(CLIENT_PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();
  return clientFormValues(data);
}

export default async function ClientRegisterPage() {
  const [country, saved] = await Promise.all([getAccountCountry(), savedProfile()]);
  const pt = country === "PT";
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{pt ? "Registe o seu perfil" : "Register your profile"}</h1>
      <div className="mt-8">
        <AccountRegisterForm variant="client" locale={pt ? "pt-PT" : "en-GB"} saved={saved} />
      </div>
    </main>
  );
}
