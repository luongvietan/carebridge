"use client";

import Image from "next/image";
import { useState } from "react";
import { CtaPillLink } from "@/components/cta-pill-link";
import { complianceFeatures } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import { ChevronDownIcon, Icon } from "@/components/ui/icon";
import { marketingHeading, marketingSection, marketingSurface } from "@/lib/marketing-ui";

const chartBars = [32, 58, 42, 76, 50, 88, 44, 68, 55, 92, 48];

function ComplianceStatusCard({
  insetSrc,
  insetAlt,
}: {
  insetSrc: string;
  insetAlt: string;
}) {
  return (
    <div className="absolute bottom-5 right-5 overflow-hidden rounded-[18px] bg-white shadow-[0_20px_50px_-12px_rgba(12,58,37,0.28)] ring-1 ring-[#e7efe9] sm:bottom-7 sm:right-7 sm:rounded-[22px]">
      <div className="flex items-stretch p-2 sm:p-2.5">
        <div className="relative w-[76px] shrink-0 overflow-hidden rounded-xl sm:w-[88px] sm:rounded-2xl">
          <Image src={insetSrc} alt={insetAlt} fill className="object-cover" sizes="96px" />
        </div>

        <div className="flex min-w-[168px] flex-col justify-center px-3 py-2 sm:min-w-[200px] sm:px-4 sm:py-2.5">
          <p className="text-[13px] font-bold leading-none tracking-tight text-[#1e5a33] sm:text-sm">
            Compliance status
          </p>
          <div
            className="mt-3 flex h-11 w-full items-end justify-between gap-[3px] sm:mt-3.5 sm:h-12 sm:gap-1"
            aria-hidden
          >
            {chartBars.map((height, i) => (
              <span
                key={i}
                className="w-[7px] flex-1 rounded-full bg-gradient-to-t from-[#246627] via-[#2e7d32] to-[#82cf58] sm:w-2"
                style={{ height: `${height}%`, minHeight: "4px" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComplianceShowcase() {
  const [openIndex, setOpenIndex] = useState(0);
  const { compliance } = marketingImages;

  return (
    <section className={marketingSection}>
      <div
        data-reveal
        className={`grid items-center gap-10 rounded-[28px] ${marketingSurface} p-6 sm:gap-12 sm:rounded-[32px] sm:p-10 lg:grid-cols-2 lg:p-12`}
      >
        <div>
          <h2 className={`leading-tight ${marketingHeading}`}>
            Verified professionals, continuous compliance
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4a4a4a] sm:text-base">
            Every professional passes eligibility screening, competency assessment and document
            verification before approval — with automatic restriction when credentials lapse.
          </p>

          <div className="mt-8 space-y-3">
            {complianceFeatures.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.title}
                  className={`overflow-hidden rounded-2xl transition ${
                    isOpen
                      ? "bg-[#2e7d32] text-white"
                      : "bg-white text-[#1e5a33]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold sm:px-6 sm:py-5 sm:text-base ${
                      !isOpen ? "hover:bg-[#eef5f0]" : ""
                    }`}
                    aria-expanded={isOpen}
                  >
                    {item.title}
                    <Icon
                      icon={ChevronDownIcon}
                      size={20}
                      strokeWidth={2}
                      className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="space-y-2.5 px-5 pb-5 text-sm leading-relaxed text-white/95 sm:px-6 sm:pb-6">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" aria-hidden />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <CtaPillLink href="/register" shadow="lg">
              Get started
            </CtaPillLink>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3.5] overflow-hidden rounded-[28px] sm:aspect-[5/4] sm:rounded-[32px]">
            <Image
              src={compliance.main.src}
              alt={compliance.main.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 520px"
            />

            <ComplianceStatusCard
              insetSrc={compliance.inset.src}
              insetAlt={compliance.inset.alt}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
