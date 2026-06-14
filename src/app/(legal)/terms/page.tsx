import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "Terms & Conditions — CareBridge Connect" };

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>
        <p className="mt-4 text-sm text-slate-600">
          By using CareBridge Connect you agree to provide accurate information, maintain valid
          compliance documentation, and use the platform lawfully. This placeholder will be replaced
          with the final terms before launch.
        </p>
      </main>
    </>
  );
}
