import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "Privacy Policy — CareBridge Connect" };

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-600">
          CareBridge Connect Ltd handles personal data in line with UK GDPR. We collect only the
          information needed to verify professionals, manage bookings and process payments, store it
          securely, and never share it without a lawful basis. This placeholder will be replaced
          with the final policy before launch.
        </p>
      </main>
    </>
  );
}
