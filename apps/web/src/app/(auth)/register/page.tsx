import { Suspense } from "react";
import { RegisterContent } from "./register-content";

function RegisterFallback() {
  return (
    <main className="mx-auto max-w-md px-5 py-12 sm:py-16">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#e7efe9]" />
      <div className="mt-6 space-y-4">
        <div className="h-10 animate-pulse rounded-xl bg-[#e7efe9]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#e7efe9]" />
        <div className="h-10 animate-pulse rounded-xl bg-[#e7efe9]" />
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterContent />
    </Suspense>
  );
}
