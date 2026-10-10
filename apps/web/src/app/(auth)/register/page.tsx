import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterContent } from "./register-content";
import Link from "next/link";
import { Tr } from "@/components/portal-locale";
import { getSelectedCountry, isRegistrationOpen } from "@/lib/marketing/market-server";

function RegisterFallback() {
  return (
    <AuthShell>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#e7efe9]" />
      <div className="mt-6 space-y-4">
        <div className="h-10 animate-pulse rounded-xl bg-[#e7efe9]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#e7efe9]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#e7efe9]" />
      </div>
    </AuthShell>
  );
}

export default async function RegisterPage() {
  const country = await getSelectedCountry();
  if (!(await isRegistrationOpen(country))) {
    return <AuthShell>
      <h1 className="text-2xl font-semibold"><Tr>Registration opening soon</Tr></h1>
      <p className="mt-4 text-slate-600"><Tr>We are preparing this market for launch. Contact us to register your interest and receive updates.</Tr></p>
      <Link href="/contact" className="mt-6 inline-block rounded-xl bg-brand-strong px-5 py-3 font-semibold text-white"><Tr>Contact CareBridge Connect</Tr></Link>
      <Link href="/login" className="mt-4 block text-sm underline"><Tr>Already have an account? Sign in</Tr></Link>
    </AuthShell>;
  }
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterContent />
    </Suspense>
  );
}
