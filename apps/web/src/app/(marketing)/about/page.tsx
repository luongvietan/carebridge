import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { siteTagline } from "@/data/marketing-copy";

export const metadata: Metadata = { title: "About — CareBridge Connect" };

const values = [
  [
    "Compliance first",
    "Only suitable, verified professionals are approved. Eligibility screening, competency assessment and document verification happen before the first booking.",
  ],
  [
    "Safety & trust",
    "Enhanced DBS, Right to Work, professional registration (NMC/HCPC), indemnity insurance and mandatory training are tracked continuously.",
  ],
  [
    "Data ownership",
    "CareBridge Connect Ltd can export all platform data — profiles, bookings, compliance records and payments — in CSV or Excel at any time.",
  ],
  [
    "Built to scale",
    "New roles, services and locations can be added without rebuilding the platform — designed for long-term operational control.",
  ],
];

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <PageHero
        title="A healthcare marketplace built on trust"
        description={siteTagline}
      />

      <main className="mx-auto max-w-5xl px-5">
        <section className="grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#0c4a35]">Our mission</h2>
            <p className="mt-4 text-[#5b6a62]">
              We connect verified healthcare professionals with private clients and organisations
              through a secure, compliant marketplace — so every booking request is matched to
              staff who are screened, assessed and continuously monitored.
            </p>
            <p className="mt-4 text-[#5b6a62]">
              Professionals complete eligibility screening, an online competency assessment (80%
              pass mark, up to three attempts) and document uploads before administrators approve
              their profile. Expired credentials automatically restrict new bookings until
              re-approved.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-[#11512f] to-[#0c3a25] p-8 text-white">
            <p className="text-sm text-[#bcd8c7]">Who we serve</p>
            <div className="mt-5 space-y-5">
              {[
                [
                  "Private clients",
                  "Individuals and families creating booking requests for trusted care at home.",
                ],
                [
                  "Organisations",
                  "Care homes, supported-living providers and healthcare organisations needing compliant cover.",
                ],
                [
                  "Professionals",
                  "Registered nurses, HCAs, support workers and physiotherapists seeking verified work.",
                ],
              ].map(([t, d]) => (
                <div key={t} className="border-t border-white/15 pt-5 first:border-0 first:pt-0">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-[#9fc4ad]">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-[#0c4a35]">What we stand for</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-[#e7efe9] bg-white p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f4ea] text-[#198038]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
                </span>
                <h3 className="mt-4 font-semibold text-[#0c4a35]">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4 rounded-3xl bg-gradient-to-r from-[#11512f] to-[#198038] px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Join CareBridge Connect</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#cdebd7]">
            Register as a verified professional, or create a booking request as a client or
            organisation.
          </p>
          <Link href="/register" className="mt-7 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c3a25] transition hover:bg-[#eafaf0]">
            Get started
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
