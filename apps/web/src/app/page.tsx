import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4">
        <section className="py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Verified healthcare professionals, on demand
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            CareBridge Connect matches compliance-checked nurses, healthcare assistants, support
            workers and physiotherapists with private clients and organisations.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Get started
            </Link>
            <Link
              href="/services"
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium"
            >
              Our services
            </Link>
          </div>
        </section>
        <section className="grid gap-6 pb-20 sm:grid-cols-3">
          {[
            ["Verified & compliant", "Every professional is DBS-checked, registered and continuously compliance-tracked."],
            ["Book with confidence", "Accept open shifts or have bookings assigned — eligibility is always enforced."],
            ["You own your data", "Export every record to CSV or Excel at any time."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
