import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Contact — CareBridge Connect" };

const field =
  "mt-1.5 w-full rounded-xl border border-[#dbe7e0] bg-white px-4 py-2.5 text-sm text-[#0f261c] placeholder:text-[#9aa8a0] focus:border-[#198038] focus:outline-none focus:ring-2 focus:ring-[#198038]/15";

const details = [
  ["Email", "hello@carebridgeconnect.example", "M4 6h16v12H4zM4 7l8 6 8-6"],
  ["Phone", "+44 (0)20 0000 0000", "M4 5c0 8 7 15 15 15l2-3-4-2-2 2c-3-1.5-6-4.5-7.5-7.5l2-2-2-4-3 2Z"],
  ["Address", "London, United Kingdom", "M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
];

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <section className="bg-[#f3f9f5]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <p className="text-sm font-semibold tracking-wide text-[#198038] uppercase">Contact us</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#0f261c]">We&apos;d love to hear from you</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5b6a62]">
            Questions about joining, booking, or compliance? Send us a message and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            action="mailto:hello@carebridgeconnect.example"
            method="post"
            encType="text/plain"
            className="rounded-3xl border border-[#e7efe9] bg-white p-7 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#33433a]">
                Full name
                <input name="name" required placeholder="Your name" className={field} />
              </label>
              <label className="block text-sm font-medium text-[#33433a]">
                Email
                <input type="email" name="email" required placeholder="you@email.com" className={field} />
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium text-[#33433a]">
              Subject
              <input name="subject" placeholder="How can we help?" className={field} />
            </label>
            <label className="mt-4 block text-sm font-medium text-[#33433a]">
              Message
              <textarea name="message" rows={5} required placeholder="Tell us a little more…" className={field} />
            </label>
            <button
              type="submit"
              className="mt-6 rounded-full bg-[#198038] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e6027]"
            >
              Send message
            </button>
          </form>

          <div className="space-y-4">
            {details.map(([label, value, icon]) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-[#e7efe9] bg-white p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e6f4ea] text-[#198038]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7a8a81]">{label}</p>
                  <p className="mt-1 text-sm font-medium text-[#0f261c]">{value}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-gradient-to-br from-[#11512f] to-[#0c3a25] p-6 text-white">
              <p className="font-semibold">Looking to join?</p>
              <p className="mt-1.5 text-sm text-[#bcd8c7]">Professionals and clients can register directly — no need to contact us first.</p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
