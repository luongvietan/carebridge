"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CtaPillLink } from "@/components/cta-pill-link";
import { ctaLabels, heroHeadline, heroSubheadline, registerLinks, regulatoryDisclaimer } from "@/data/marketing-copy";
import { marketingImages } from "@/data/marketing-images";
import { Icon, StarIcon } from "@/components/ui/icon";
import { marketingCard, marketingSectionShell } from "@/lib/marketing-ui";

gsap.registerPlugin(useGSAP);

export function HeroSection() {
  const { hero, heroAvatars } = marketingImages;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(
          "[data-hero-badge]",
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55 },
        )
          .fromTo(
            "[data-hero-title]",
            { y: 44, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.85 },
            "-=0.25",
          )
          .fromTo(
            "[data-hero-desc]",
            { y: 28, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.65 },
            "-=0.55",
          )
          .fromTo(
            "[data-hero-cta] > *",
            { y: 22, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1 },
            "-=0.4",
          )
          .fromTo(
            "[data-hero-float]",
            { x: 36, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.75, ease: "power2.out" },
            "-=0.55",
          );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          "[data-hero-badge], [data-hero-title], [data-hero-desc], [data-hero-cta], [data-hero-float]",
          { autoAlpha: 1, y: 0, x: 0 },
        );
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className={`${marketingSectionShell} pb-2 pt-4 sm:pt-6 lg:pb-4`}>
      <div
        className={`relative mx-auto min-h-[520px] max-w-7xl overflow-hidden ${marketingCard} sm:min-h-[560px] lg:min-h-[600px]`}
      >
        <div data-hero-image className="absolute inset-0">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            className="object-cover object-[65%_center]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

        <div className="relative flex min-h-[520px] flex-col justify-between p-6 sm:min-h-[560px] sm:p-8 lg:min-h-[600px] lg:p-10">
          <div
            data-hero-badge
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-sm"
          >
            <Icon icon={StarIcon} size={16} color="#6cc24a" strokeWidth={1.75} />
            <span>Verified healthcare staffing</span>
          </div>

          <div className="mt-auto max-w-2xl pb-2 pt-10 sm:pb-4 lg:max-w-3xl">
            <h1
              data-hero-title
              className="text-[2rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
            >
              {heroHeadline}
            </h1>
            <p
              data-hero-desc
              className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg"
            >
              {heroSubheadline}
            </p>

            <p className="mt-4 max-w-xl rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white/90 backdrop-blur-sm">
              {regulatoryDisclaimer}
            </p>

            <div data-hero-cta className="mt-7 flex flex-wrap gap-3 sm:gap-4">
              <CtaPillLink href={registerLinks.professional} shadow="lg">
                {ctaLabels.joinProfessional}
              </CtaPillLink>
              <CtaPillLink href={registerLinks.client} variant="secondary" shadow="lg">
                {ctaLabels.createBookingRequest}
              </CtaPillLink>
            </div>
          </div>

          <div
            data-hero-float
            className="absolute bottom-6 right-6 hidden rounded-2xl bg-white px-5 py-4 shadow-xl sm:block lg:bottom-10 lg:right-10"
          >
            <p className="text-[15px] font-bold text-[#1e5a33]">Compliance built in</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {heroAvatars.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    aria-hidden={i > 0}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-[#4a4a4a]">4 verified role types</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
