import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Services — CareBridge Connect" };

const roles = [
  ["Registered Nurses", "NMC-registered nurses for clinical and complex care, medication management and assessments.", "M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z"],
  ["Healthcare Assistants", "Experienced HCAs supporting personal care, mobility and day-to-day wellbeing.", "M4.5 12.5 9 17l10.5-10.5"],
  ["Support Workers", "Trained support workers for community, residential and supported-living settings.", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"],
  ["Physiotherapists", "HCPC-registered physiotherapists for rehabilitation and mobility programmes.", "M4 12h3l2 6 4-14 2 8h5"],
];

const steps = [
  ["Request", "Create a booking — choose the role, date, time, duration and location."],
  ["Match", "A qualified professional accepts your open booking, or an admin assigns one directly."],
  ["Care", "Compliance is verified at the point of booking. Payments are handled securely via Stripe."],
];

export default function ServicesPage() {
  return (
    <>
      <SiteNav />
      <section className="bg-[#f3f9f5]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">Services / what we offer</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#0f261c]">Verified professionals, across four roles</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5b6a62]">
            Comprehensive, compliance-checked healthcare staffing for private clients and organisations.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5">
        <section className="grid gap-5 py-16 sm:grid-cols-2">
          {roles.map(([name, body, icon]) => (
            <div key={name} className="flex gap-5 rounded-2xl border border-[#e7efe9] bg-white p-6 transition hover:border-[#198038] hover:shadow-[0_12px_40px_-12px_rgba(25,128,56,0.2)]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e6f4ea] text-[#198038]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
              </span>
              <div>
                <h2 className="font-semibold text-[#0f261c]">{name}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5b6a62]">{body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-[#f3f9f5] p-8 sm:p-12">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f261c]">From request to care, in three steps</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <div key={t} className="rounded-2xl border border-[#e7efe9] bg-white p-7">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#198038] text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-[#0f261c]">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4 mt-16 rounded-3xl bg-gradient-to-r from-[#11512f] to-[#198038] px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Need trusted, compliant care?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#cdebd7]">Register as a client or organisation and create your first booking.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c3a25] transition hover:bg-[#eafaf0]">Register</Link>
            <Link href="/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Talk to us</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
