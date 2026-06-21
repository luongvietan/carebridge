import type { Metadata } from "next";
import Image from "next/image";
import { ForwardLink } from "@/components/forward-link";
import { CtaBanner } from "@/components/cta-banner";
import { CtaPillLink } from "@/components/cta-pill-link";
import { ImportantInfoCallout } from "@/components/important-info-callout";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MarketingPageMotion } from "@/components/motion/marketing-page-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { StatsBand } from "@/components/stats-band";
import { aboutContent } from "@/data/legal-copy";
import { marketingImages } from "@/data/marketing-images";
import {
  marketingCardShadow,
  marketingHeading,
  marketingSection,
  marketingSubheading,
  marketingSurface,
} from "@/lib/marketing-ui";
import { CheckmarkCircle01Icon, Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "About — CareBridge Connect" };

const imageShell =
  "relative overflow-hidden rounded-[28px] shadow-[0_16px_40px_-16px_rgba(15,38,28,0.28)] sm:rounded-[32px]";

export default function AboutPage() {
  const { about } = marketingImages;
  const { welcome, mission, vision, commitment, verification, importantInfo, founder } =
    aboutContent;

  return (
    <MarketingPageMotion>
      <SiteNav />

      <MarketingPageHero
        badge="About CareBridge Connect"
        title="Welcome to CareBridge Connect"
        description="A healthcare marketplace connecting community clients, families and organisations with trusted healthcare professionals across the United Kingdom."
        image={marketingImages.pageHero.about}
      />

      <StatsBand />

      <main>
        <section className={marketingSection}>
          <div data-reveal className="mx-auto max-w-3xl text-center">
            {welcome.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-[15px] leading-relaxed text-[#33433a] sm:text-base">
                {paragraph}
              </p>
            ))}
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
              <h2 className="text-xl font-bold text-[#1e5a33] sm:text-2xl">{mission.heading}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#33433a] sm:text-base">
                {mission.text}
              </p>

              <h2 className="mt-8 text-xl font-bold text-[#1e5a33] sm:text-2xl">{vision.heading}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#33433a] sm:text-base">
                {vision.text}
              </p>

              <div className="mt-8">
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
            className={`rounded-[28px] ${marketingSurface} p-6 sm:rounded-[32px] sm:p-10`}
          >
            <h2 className={marketingHeading}>{commitment.heading}</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4a4a4a] sm:text-base">
              {commitment.intro}
            </p>
            <ul className="mt-6 space-y-3">
              {commitment.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <Icon
                    icon={CheckmarkCircle01Icon}
                    size={22}
                    color="#2e7d32"
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-sm font-medium leading-snug text-[#1e5a33] sm:text-[15px]">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{verification.heading}</h2>
            <p className={`${marketingSubheading} max-w-2xl`}>{verification.intro}</p>
          </div>

          <div data-reveal-stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {verification.bullets.map((item) => (
              <div
                key={item}
                data-reveal-child
                className={`rounded-2xl bg-white p-5 text-sm font-medium text-[#1e5a33] ${marketingCardShadow}`}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div
            data-reveal
            className={`rounded-[28px] border-2 border-[#2e7d32]/25 ${marketingSurface} p-6 sm:rounded-[32px] sm:p-10`}
          >
            <h2 className={marketingHeading}>{importantInfo.heading}</h2>
            <div className="mt-6 space-y-4">
              {importantInfo.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-[#4a4a4a] sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
            <ForwardLink
              href="/disclaimer"
              className="mt-6 text-sm font-semibold text-[#2e7d32] hover:underline"
            >
              Read the full disclaimer
            </ForwardLink>
          </div>
        </section>

        <section className={marketingSection}>
          <div
            data-reveal
            className={`rounded-[28px] bg-white p-8 ${marketingCardShadow} sm:rounded-[32px] sm:p-12`}
          >
            <h2 className={marketingHeading}>{founder.heading}</h2>
            <blockquote className="mt-5 border-l-4 border-[#2e7d32] pl-5">
              {founder.quote.split("\n\n").map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-sm leading-relaxed text-[#4a4a4a] first:mt-0 sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </blockquote>
            <div className="mt-8 border-t border-[#e7efe9] pt-6">
              <p className="font-bold text-[#1e5a33]">{founder.name}</p>
              <p className="mt-1 text-sm text-[#4a4a4a]">{founder.title}</p>
              <p className="text-sm text-[#4a4a4a]">{founder.company}</p>
              <p className="mt-4 text-sm font-semibold text-[#2e7d32]">{founder.tagline}</p>
            </div>
          </div>
        </section>

        <ImportantInfoCallout />

        <CtaBanner />
      </main>

      <SiteFooter />
    </MarketingPageMotion>
  );
}
