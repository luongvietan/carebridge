import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Privacy Policy — CareBridge Connect" };

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0f261c]">Privacy Policy</h1>
        <p className="mt-5 leading-relaxed text-[#5b6a62]">
          CareBridge Connect Ltd handles personal data in line with UK GDPR. We collect only the
          information needed to verify professionals, manage bookings and process payments, store it
          securely, and never share it without a lawful basis. This placeholder will be replaced with
          the final policy before launch.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
