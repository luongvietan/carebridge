import type { Metadata } from "next";
import Image from "next/image";
import { CtaBanner } from "@/components/cta-banner";
import { CtaPillLink } from "@/components/cta-pill-link";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MarketingPageMotion } from "@/components/motion/marketing-page-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { StatsBand } from "@/components/stats-band";
import { aboutFeatures, siteTagline } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import {
  marketingCardShadow,
  marketingDecorativeNumber,
  marketingHeading,
  marketingSection,
  marketingSubheading,
  marketingSurface,
} from "@/lib/marketing-ui";
import { CheckmarkCircle01Icon, Icon } from "@/components/ui/icon";

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
] as const;

const audiences = [
  [
    "Private clients",
    "Individuals and families creating booking requests for verified, non-regulated support.",
  ],
  [
    "Organisations",
    "Healthcare organisations, supported living services, care providers and healthcare facilities needing access to verified professionals.",
  ],
  [
    "Professionals",
    "Registered nurses, HCAs, support workers and physiotherapists seeking verified work.",
  ],
] as const;

const imageShell =
  "relative overflow-hidden rounded-[28px] shadow-[0_16px_40px_-16px_rgba(15,38,28,0.28)] sm:rounded-[32px]";

export default function AboutPage() {
  const { about } = marketingImages;

  return (
    <MarketingPageMotion>
      <SiteNav />

      <MarketingPageHero
        badge="About CareBridge Connect"
        title="A healthcare marketplace built on trust"
        description={siteTagline}
        image={marketingImages.pageHero.about}
      />

      <StatsBand />

      <main>
        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>Our mission</h2>
            <p className={`${marketingSubheading} max-w-2xl`}>
              We connect verified healthcare professionals with private clients and organisations
              through a secure, compliant marketplace.
            </p>
          </div>

          <div
            data-reveal-stagger
            className="mt-12 grid grid-cols-12 items-center gap-4 sm:gap-5 lg:mt-16 lg:gap-6 xl:gap-8"
          >
            <div
              data-reveal-child
              className={`${imageShell} col-span-5 h-[220px] sm:h-[260px] lg:col-span-3 lg:h-[340px]`}
            >
              <Image
                src={about.primary.src}
                alt={about.primary.alt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 38vw, 220px"
              />
            </div>

            <div
              data-reveal-child
              className={`${imageShell} col-span-7 h-[280px] sm:h-[340px] lg:col-span-4 lg:h-[460px]`}
            >
              <Image
                src={about.secondary.src}
                alt={about.secondary.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 58vw, 380px"
              />
            </div>

            <div
              data-reveal-child
              className="col-span-12 flex flex-col justify-center pt-2 lg:col-span-5 lg:pt-0"
            >
              <p className="text-[15px] leading-[1.7] text-[#33433a] sm:text-base sm:leading-relaxed">
                Professionals complete eligibility screening, an online competency assessment (80%
                pass mark, up to three attempts) and document uploads before administrators approve
                their profile. Expired credentials automatically restrict new bookings until
                re-approved.
              </p>

              <ul className="mt-7 space-y-3.5 sm:mt-8">
                {aboutFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Icon
                      icon={CheckmarkCircle01Icon}
                      size={22}
                      color="#0c6e4f"
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm font-medium leading-snug text-[#0c4a35] sm:text-[15px]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 sm:mt-9">
                <CtaPillLink href="/register" shadow="lg">
                  Get started
                </CtaPillLink>
              </div>
            </div>
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div
            data-reveal
            className={`grid gap-10 rounded-[28px] ${marketingSurface} p-6 sm:rounded-[32px] sm:p-10 lg:grid-cols-2 lg:items-center lg:p-12`}
          >
            <div>
              <h2 className={marketingHeading}>Who we serve</h2>
              <p className={`mt-4 ${marketingSubheading} mx-0 max-w-none text-left`}>
                Three audiences, one compliant marketplace — from families arranging non-regulated
                support to organisations needing verified cover at scale.
              </p>
            </div>

            <div data-reveal-stagger className="space-y-4">
              {audiences.map(([title, description]) => (
                <div
                  key={title}
                  data-reveal-child
                  className={`rounded-2xl bg-white p-6 ${marketingCardShadow}`}
                >
                  <h3 className="font-bold text-[#0c4a35]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>What we stand for</h2>
            <p className={marketingSubheading}>
              Principles that guide every verification, booking and compliance decision on the
              platform.
            </p>
          </div>

          <div data-reveal-stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([title, description], i) => (
              <div
                key={title}
                data-reveal-child
                className={`rounded-[28px] bg-white p-7 ${marketingCardShadow} sm:rounded-[32px]`}
              >
                <span className={`text-5xl font-bold ${marketingDecorativeNumber}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#0c4a35] sm:text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5b6a62]">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <CtaBanner />
      </main>

      <SiteFooter />
    </MarketingPageMotion>
  );
}
