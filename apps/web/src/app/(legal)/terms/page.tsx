import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight01Icon, Icon } from "@/components/ui/icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = { title: "Terms & Conditions — CareBridge Connect" };

const termsLinks = [
  {
    href: "/terms/clients",
    title: "Client Terms & Conditions",
    description:
      "Terms governing the use of CareBridge Connect by clients seeking healthcare support services.",
  },
  {
    href: "/terms/professionals",
    title: "Professional Terms & Conditions",
    description:
      "Terms governing the use of CareBridge Connect by healthcare professionals on the platform.",
  },
] as const;

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0f261c]">
          Terms &amp; Conditions
        </h1>
        <p className="mt-5 leading-relaxed text-[#5b6a62]">
          CareBridge Connect provides separate terms for clients and healthcare professionals.
          Select the document that applies to you.
        </p>

        <div className="mt-10 space-y-4">
          {termsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl border border-[#e7efe9] bg-white p-6 transition hover:border-[#0c6e4f] hover:shadow-[0_8px_30px_-12px_rgba(15,38,28,0.12)]"
            >
              <h2 className="text-lg font-semibold text-[#0c4a35]">{link.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{link.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c6e4f]">
                Read document
                <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
