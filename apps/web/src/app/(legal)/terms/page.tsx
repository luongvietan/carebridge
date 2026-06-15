import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Terms & Conditions — CareBridge Connect" };

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0f261c]">Terms &amp; Conditions</h1>
        <p className="mt-5 leading-relaxed text-[#5b6a62]">
          By using CareBridge Connect you agree to provide accurate information, maintain valid
          compliance documentation, and use the platform lawfully. This placeholder will be replaced
          with the final terms before launch.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
