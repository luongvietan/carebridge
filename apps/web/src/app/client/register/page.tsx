import { AccountRegisterForm } from "@/components/account-register-form";

export default function ClientRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm tracking-wide text-[#525252] uppercase">Client account</p>
      <h1 className="mt-1 text-3xl font-light">Register your profile</h1>
      <div className="mt-8">
        <AccountRegisterForm variant="client" />
      </div>
    </main>
  );
}
