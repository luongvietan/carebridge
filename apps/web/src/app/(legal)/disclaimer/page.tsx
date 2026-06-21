import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  emergencyDisclaimer,
  importantInformation,
  supportedServices,
} from "@/data/marketing-copy";

export const metadata: Metadata = {
  title: "Important information & disclaimer — CareBridge Connect",
};

export default function DisclaimerPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#14301e]">
          {importantInformation.heading}
        </h1>
        <p className="mt-5 leading-relaxed text-[#4a4a4a]">{importantInformation.intro}</p>
        {importantInformation.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mt-4 leading-relaxed text-[#4a4a4a]">
            {paragraph}
          </p>
        ))}

        <div className="mt-8 rounded-xl border border-[#f5c6cb] bg-[#fff5f5] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#8b2e2e]">Emergency services</h2>
          <p className="mt-2 leading-relaxed text-[#8b2e2e]">{emergencyDisclaimer}</p>
        </div>

        <h2 className="mt-10 text-xl font-semibold text-[#14301e]">Services we support</h2>
        <p className="mt-3 leading-relaxed text-[#4a4a4a]">
          Services available through the platform are limited to the following non-regulated
          activities:
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {supportedServices.map((service) => (
            <li key={service} className="flex items-start gap-2 text-[#4a4a4a]">
              <span aria-hidden className="mt-1 text-[#2e7d32]">
                •
              </span>
              <span>{service}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 leading-relaxed text-[#4a4a4a]">…and other non-regulated activities.</p>

        <h2 className="mt-10 text-xl font-semibold text-[#14301e]">Who the platform is for</h2>
        <p className="mt-3 leading-relaxed text-[#4a4a4a]">{importantInformation.audienceLabel}</p>
      </main>
      <SiteFooter />
    </>
  );
}
