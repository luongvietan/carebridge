import { AccountRegisterForm } from "@/components/account-register-form";

export default function ClientRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mt-1 text-3xl font-bold">Register your profile</h1>
      <div className="mt-8">
        <AccountRegisterForm variant="client" />
      </div>
    </main>
  );
}
