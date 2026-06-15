import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "About — CareBridge Connect" };

const values = [
  ["Compliance first", "Only suitable, verified professionals join. We track every credential continuously."],
  ["Safety & trust", "DBS, registration, insurance and training are checked before a first booking."],
  ["Data ownership", "CareBridge Connect owns and can export all platform data at any time."],
  ["Built to scale", "New roles, services and locations slot in without rebuilding the platform."],
];

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <section className="bg-[#f3f9f5]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">About us</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#0f261c]">
            Healthcare staffing, built on trust
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5b6a62]">
            CareBridge Connect connects verified healthcare professionals with private clients and
            organisations — putting compliance, safety and data ownership first.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5">
        <section className="grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#0f261c]">Our mission</h2>
            <p className="mt-4 text-[#5b6a62]">
              We make it simple to find the right professional for the right care — without
              compromising on verification. Every nurse, healthcare assistant, support worker and
              physiotherapist is screened, assessed and continuously monitored, so clients and
              organisations can book with complete confidence.
            </p>
            <p className="mt-4 text-[#5b6a62]">
              The platform ensures only suitable, verified professionals are approved, with continuous
              tracking of DBS, professional registration, insurance and mandatory training.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-[#11512f] to-[#0c3a25] p-8 text-white">
            <p className="text-sm text-[#bcd8c7]">Who we serve</p>
            <div className="mt-5 space-y-5">
              {[["Private clients", "Individuals and families arranging trusted care at home."], ["Organisations", "Care homes and supported-living providers needing reliable, compliant staff."], ["Professionals", "Verified clinicians and carers seeking suitable, well-matched work."]].map(([t, d]) => (
                <div key={t} className="border-t border-white/15 pt-5 first:border-0 first:pt-0">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-[#9fc4ad]">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-[#0f261c]">What we stand for</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-[#e7efe9] bg-white p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f4ea] text-[#198038]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
                </span>
                <h3 className="mt-4 font-semibold text-[#0f261c]">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4 rounded-3xl bg-gradient-to-r from-[#11512f] to-[#198038] px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Join CareBridge Connect</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#cdebd7]">Become a verified professional, or register as a client today.</p>
          <Link href="/register" className="mt-7 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c3a25] transition hover:bg-[#eafaf0]">
            Get started
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
