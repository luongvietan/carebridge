import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { getContentForVisitor } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Contact — CareBridge Connect" };

const detailRows = [
  ["email", CONTACT_EMAIL, "M4 6h16v12H4zM4 7l8 6 8-6"],
  ["phone", "+44 (0)161 000 0000", "M4 5c0 8 7 15 15 15l2-3-4-2-2 2c-3-1.5-6-4.5-7.5-7.5l2-2-2-4-3 2Z"],
  ["address", "Manchester, United Kingdom", "M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
];

export default async function ContactPage() {
  const { ui } = await getContentForVisitor();
  const c = ui.contact;
  const details = detailRows.map(([key, value, icon]) => [c[key as "email" | "phone" | "address"], value, icon] as const);
  return (
    <>
      <SiteNav />
      <PageHero
        title={c.title}
        description={c.description}
      />

      <main className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <ContactForm labels={ui.contactForm} />

          <div className="space-y-4">
            {details.map(([label, value, icon]) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-[#e7efe9] bg-white p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e6f4ea] text-[#2e7d32]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7a8a81]">{label}</p>
                  <p className="mt-1 text-sm font-medium text-[#14301e]">{value}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-gradient-to-br from-[#11512f] to-[#17492c] p-6 text-white">
              <p className="font-semibold">{c.joinTitle}</p>
              <p className="mt-1.5 text-sm text-[#bcd8c7]">
                {c.joinBody}
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
