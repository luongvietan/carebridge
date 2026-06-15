import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const roles = [
  { name: "Registered Nurses", body: "NMC-registered nurses for clinical and complex care.", icon: "M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" },
  { name: "Healthcare Assistants", body: "Experienced HCAs supporting day-to-day care.", icon: "M4.5 12.5 9 17l10.5-10.5" },
  { name: "Support Workers", body: "Trained support workers for community & residential.", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" },
  { name: "Physiotherapists", body: "HCPC-registered physiotherapists for rehab.", icon: "M4 12h3l2 6 4-14 2 8h5" },
];

const stats = [
  ["100%", "Compliance-checked"],
  ["4", "Professional roles"],
  ["24/7", "Booking access"],
  ["CSV / XLSX", "Your data, exportable"],
];

const steps = [
  ["Register & verify", "Professionals complete eligibility, a competency assessment and document checks — all reviewed by our admins."],
  ["Match a booking", "Clients and organisations post bookings; qualified professionals accept, or admins assign directly."],
  ["Work with confidence", "Compliance is enforced at the point of booking, and every action is audited end-to-end."],
];

const testimonials = [
  ["The verification gave us total peace of mind — every professional was DBS-checked and registered before they set foot on site.", "Care Home Manager", "Organisation"],
  ["Booking a physiotherapist took minutes and the compliance was already handled. Exactly what we needed.", "Private Client", "Family carer"],
  ["As a nurse, onboarding was clear and quick. I was matched to suitable shifts almost immediately.", "Registered Nurse", "Professional"],
];

export default function HomePage() {
  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c3a25] to-[#11512f] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#1f8f47]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#0a2c1d]/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#cdebd7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5fd08a]" /> Verified healthcare staffing
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Your health & wellness,{" "}
              <span className="text-[#7ed7a0]">simplified</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#bcd8c7]">
              CareBridge Connect matches compliance-checked nurses, healthcare assistants, support
              workers and physiotherapists with private clients and organisations across the UK.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c3a25] shadow-sm transition hover:bg-[#eafaf0]"
              >
                Book an appointment
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore services
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-4 text-sm text-[#bcd8c7]">
              <div className="flex -space-x-2">
                {["#7ed7a0", "#bcd8c7", "#5fd08a", "#a9c6b5"].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full border-2 border-[#0c3a25]" style={{ background: c }} />
                ))}
              </div>
              <p>
                <span className="font-semibold text-white">Trusted</span> by clients &amp;
                organisations · compliance built in
              </p>
            </div>
          </div>

          {/* Floating glass stat card */}
          <div className="relative lg:mt-6">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
              <div className="rounded-2xl bg-white p-5 text-[#0f261c]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b7a72]">Compliance status</p>
                <div className="mt-3 space-y-3">
                  {["Enhanced DBS", "Right to Work", "Professional registration", "Indemnity insurance"].map((d) => (
                    <div key={d} className="flex items-center justify-between text-sm">
                      <span>{d}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-medium text-[#0e6027]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#24a148]" /> Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 px-1 text-sm text-[#cdebd7]">
                Every professional is continuously tracked — bookings auto-lock the moment a document lapses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-[#198038]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/15 px-5 py-8 text-white sm:grid-cols-4">
          {stats.map(([n, l]) => (
            <div key={l} className="px-4 text-center">
              <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{n}</div>
              <div className="mt-1 text-xs text-[#cdebd7] sm:text-sm">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5">
        {/* Roles / services */}
        <section className="py-20">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">What we offer</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f261c] sm:text-4xl">
              Verified professionals, across four roles
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <div
                key={r.name}
                className="group rounded-2xl border border-[#e7efe9] bg-white p-6 transition hover:border-[#198038] hover:shadow-[0_12px_40px_-12px_rgba(25,128,56,0.25)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6f4ea] text-[#198038] transition group-hover:bg-[#198038] group-hover:text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={r.icon} />
                  </svg>
                </span>
                <h3 className="mt-5 font-semibold text-[#0f261c]">{r.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance-first */}
        <section className="grid items-center gap-12 rounded-3xl bg-[#f3f9f5] p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">Compliance first</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f261c]">
              Experienced &amp; certified professionals
            </h2>
            <p className="mt-4 text-[#5b6a62]">
              Only suitable, verified professionals join the marketplace. We check and continuously
              track every credential, so a lapse instantly restricts new bookings.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Enhanced DBS & Right to Work checks",
                "Professional registration (NMC / HCPC)",
                "Indemnity insurance & mandatory training",
                "80% competency assessment before approval",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#33433a]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#198038] text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 inline-block rounded-full bg-[#198038] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6027]">
              Join as a professional
            </Link>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-[#11512f] to-[#0c3a25] p-8 text-white">
            <div className="text-5xl font-semibold tracking-tight">100%</div>
            <p className="mt-2 text-[#bcd8c7]">of approved professionals pass full compliance verification before their first booking.</p>
            <div className="mt-8 space-y-4">
              {[["Documents tracked", "every credential, with expiry"], ["Auto-restriction", "the moment a document lapses"], ["Full audit trail", "who did what, and when"]].map(([t, d]) => (
                <div key={t} className="flex items-center justify-between border-t border-white/15 pt-4 first:border-0 first:pt-0">
                  <span className="font-medium">{t}</span>
                  <span className="text-sm text-[#9fc4ad]">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f261c] sm:text-4xl">Three steps to confident care</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <div key={t} className="relative rounded-2xl border border-[#e7efe9] bg-white p-7">
                <span className="text-5xl font-semibold text-[#e6f4ea]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-[#0f261c]">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="pb-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0f261c] sm:text-4xl">What people say</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map(([quote, name, role]) => (
              <figure key={name} className="rounded-2xl border border-[#e7efe9] bg-white p-6">
                <div className="text-[#198038]" aria-hidden>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h4v4c0 3-2 5-5 5v-2c1.5 0 3-1 3-3H7V7Zm8 0h4v4c0 3-2 5-5 5v-2c1.5 0 3-1 3-3h-2V7Z" /></svg>
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-[#33433a]">{quote}</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-[#0f261c]">{name}</span>
                  <span className="text-[#7a8a81]"> · {role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#11512f] to-[#198038] px-8 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#cdebd7]">
            Register today — whether you&apos;re a professional looking for work, or a client who needs
            trusted, compliant care.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c3a25] transition hover:bg-[#eafaf0]">
              Create an account
            </Link>
            <Link href="/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Talk to us
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
