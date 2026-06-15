import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "FAQ — CareBridge Connect" };

const faqs = [
  ["How are professionals verified?", "Administrators review Enhanced DBS, Right to Work, professional registration (NMC/HCPC), indemnity insurance and mandatory training certificates before a professional is approved. Credentials are then tracked continuously."],
  ["What happens if a document expires?", "The platform automatically restricts a professional from accepting new bookings the moment a critical document lapses, and only reinstates them after an administrator re-approves the updated document."],
  ["How do bookings work?", "Clients and organisations create booking requests. Qualified professionals can accept open bookings, or administrators can assign bookings directly. Compliance is enforced at the point of acceptance or assignment."],
  ["Is there a competency assessment?", "Yes. Every professional completes an online assessment covering safeguarding, infection control, GDPR, medication awareness and more. The pass mark is 80%, with up to three attempts."],
  ["How are payments handled?", "Client payments are collected securely via Stripe. Professional payouts are recorded and managed within the platform."],
  ["Can we export our data?", "Yes — CareBridge Connect can export all key data (profiles, bookings, compliance, assessments and payments) to CSV or Excel at any time."],
];

export default function FaqPage() {
  return (
    <>
      <SiteNav />
      <section className="bg-[#f3f9f5]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">Frequently asked questions</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#0f261c]">Answers, before you ask</h1>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-[#e7efe9] bg-white p-5 open:border-[#198038] open:bg-[#f9fcfa]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-[#0f261c] marker:content-['']">
                {q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e6f4ea] text-[#198038] transition group-open:rotate-45">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#5b6a62]">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#11512f] to-[#198038] px-8 py-10 text-center text-white">
          <h2 className="text-xl font-semibold tracking-tight">Still have a question?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#cdebd7]">Our team is happy to help — reach out and we&apos;ll get back to you.</p>
          <Link href="/contact" className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c3a25] transition hover:bg-[#eafaf0]">Contact us</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
