import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { faqs } from "@/data/faqs";

export const metadata: Metadata = { title: "FAQ — CareBridge Connect" };

export default function FaqPage() {
  return (
    <>
      <SiteNav />
      <PageHero
        title="Frequently asked questions"
        description="Trusted answers about verification, booking requests, compliance blocking, payments and data export."
      />

      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-[#e7efe9] bg-white p-5 open:border-[#198038] open:bg-[#f9fcfa]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-[#0c4a35] marker:content-['']">
                {faq.question}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e6f4ea] text-[#198038] transition group-open:rotate-45">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#5b6a62]">{faq.answer}</p>
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
