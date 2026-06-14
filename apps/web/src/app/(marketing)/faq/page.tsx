import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "FAQ — CareBridge Connect" };

const faqs = [
  ["How are professionals verified?", "Administrators review DBS, Right to Work, professional registration, insurance and mandatory training before approval."],
  ["How do bookings work?", "Professionals can accept open bookings, and administrators can assign bookings directly. Compliance is checked at the point of acceptance."],
  ["How are payments handled?", "Client payments are collected securely via Stripe; professional payouts are managed in-platform."],
];

export default function FaqPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Frequently asked questions</h1>
        <dl className="mt-6 space-y-6">
          {faqs.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-sm text-slate-600">{a}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  );
}
