import { AccountRegisterForm } from "@/components/account-register-form";
import { getSelectedCountry } from "@/lib/marketing/market-server";

export default async function ClientRegisterPage() {
  const pt = (await getSelectedCountry()) === "PT";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">{pt ? "Registe o seu perfil" : "Register your profile"}</h1>
      <div className="mt-8">
        <AccountRegisterForm variant="client" locale={pt ? "pt-PT" : "en-GB"} />
      </div>
    </main>
  );
}
