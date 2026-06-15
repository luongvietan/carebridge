import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterContent } from "./register-content";

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

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterContent />
    </Suspense>
  );
}
