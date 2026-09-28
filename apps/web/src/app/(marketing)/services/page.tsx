import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { ImportantInfoCallout } from "@/components/important-info-callout";
import { CtaPillLink } from "@/components/cta-pill-link";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MarketingPageMotion } from "@/components/motion/marketing-page-motion";
import { RoleCard } from "@/components/role-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { marketingImages } from "@/data/marketing-images";
import { roleImage } from "@/lib/i18n/content";
import { getContentForVisitor, getDictionaryForVisitor } from "@/lib/i18n/server";
import {
  marketingCardShadow,
  marketingDecorativeNumber,
  marketingHeading,
  marketingSection,
  marketingSubheading,
  marketingSurface,
} from "@/lib/marketing-ui";

export const metadata: Metadata = { title: "Professional roles — CareBridge Connect" };

export default async function ServicesPage() {
  const [content, t] = await Promise.all([getContentForVisitor(), getDictionaryForVisitor()]);
  const { ui, healthRoles, childcareRoles, childcareCareTypes, supportedServices } = content;
  const s = ui.servicesPage;
  return (
    <MarketingPageMotion>
      <SiteNav />

      <MarketingPageHero
        badge={s.badge}
        title={s.title}
        description={s.description}
        image={marketingImages.pageHero.services}
      />

      <main>
        <section className={marketingSection}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{s.healthHeading}</h2>
            <p className={`${marketingSubheading} max-w-lg`}>
              {s.healthSub}
            </p>
          </div>

          <div data-reveal-stagger className="mt-12 grid gap-6 sm:grid-cols-2">
            {healthRoles.map((role) => {
              const img = roleImage(role.image);
              return (
                <RoleCard
                  key={role.title}
                  title={role.title}
                  description={role.description}
                  image={img.src}
                  alt={img.alt}
                />
              );
            })}
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{s.childHeading}</h2>
            <p className={`${marketingSubheading} max-w-2xl`}>
              {s.childSub}
            </p>
          </div>

          <div data-reveal-stagger className="mt-12 grid gap-6 sm:grid-cols-2">
            {childcareRoles.map((role) => {
              const img = roleImage(role.image);
              return (
                <RoleCard
                  key={role.title}
                  title={role.title}
                  description={role.description}
                  image={img.src}
                  alt={img.alt}
                />
              );
            })}
          </div>

          <div data-reveal className="mx-auto mt-10 max-w-3xl text-center">
            <h3 className="text-lg font-bold text-[#1e5a33]">{s.careTypesHeading}</h3>
            <p className="mt-2 text-sm text-[#4a4a4a]">
              {s.careTypesSub}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {childcareCareTypes.map((type) => (
                <span
                  key={type}
                  className={`rounded-full bg-white px-4 py-2 text-sm font-medium text-[#1e5a33] ${marketingCardShadow}`}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{s.servicesHeading}</h2>
            <p className={`${marketingSubheading} max-w-2xl`}>
              {s.servicesSub}
            </p>
          </div>

          <div data-reveal-stagger className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {supportedServices.map((service) => (
              <div
                key={service}
                data-reveal-child
                className={`rounded-2xl bg-white p-5 text-sm font-medium text-[#1e5a33] ${marketingCardShadow}`}
              >
                {service}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[#4a4a4a]">
            {s.andOthers}
          </p>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div data-reveal className="text-center">
            <h2 className={marketingHeading}>{s.howHeading}</h2>
            <p className={marketingSubheading}>
              {s.howSub}
            </p>
          </div>

          <div data-reveal-stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {t.onboardingSteps.map((step, i) => (
              <div
                key={step.title}
                data-reveal-child
                className={`rounded-[28px] bg-white p-7 ${marketingCardShadow} sm:rounded-[32px]`}
              >
                <span className={`text-5xl font-bold ${marketingDecorativeNumber}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold text-[#1e5a33] sm:text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4a4a4a]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${marketingSection} pt-0`}>
          <div
            data-reveal
            className={`rounded-[28px] ${marketingSurface} p-8 text-center sm:rounded-[32px] sm:p-12`}
          >
            <h2 className="text-2xl font-bold tracking-tight text-[#1e5a33] sm:text-3xl">
              {s.readyHeading}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#4a4a4a] sm:text-base">
              {s.readyBody}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaPillLink href="/register?as=client" shadow="lg">
                {t.createBookingRequest}
              </CtaPillLink>
              <CtaPillLink href="/register?as=professional" variant="secondary" shadow="lg">
                {t.joinProfessional}
              </CtaPillLink>
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
