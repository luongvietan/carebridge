"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { marketingCard, marketingSectionShell } from "@/lib/marketing-ui";

gsap.registerPlugin(useGSAP);

type MarketingPageHeroProps = {
  title: string;
  description?: string;
  badge?: string;
  image: { src: string; alt: string };
};

export function MarketingPageHero({ title, description, badge, image }: MarketingPageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(
          "[data-page-hero-badge]",
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5 },
        )
          .fromTo(
            "[data-page-hero-title]",
            { y: 32, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7 },
            "-=0.2",
          )
          .fromTo(
            "[data-page-hero-desc]",
            { y: 20, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.55 },
            "-=0.45",
          );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-page-hero-badge], [data-page-hero-title], [data-page-hero-desc]", {
          autoAlpha: 1,
          y: 0,
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className={`${marketingSectionShell} pb-2 pt-4 sm:pt-6`}>
      <div
        className={`relative mx-auto min-h-[280px] max-w-7xl overflow-hidden ${marketingCard} sm:min-h-[320px] lg:min-h-[360px]`}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

        <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[320px] sm:p-8 lg:min-h-[360px] lg:p-10">
          {badge ? (
            <p
              data-page-hero-badge
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#7ed7a0]" aria-hidden />
              {badge}
            </p>
          ) : null}

          <div className="max-w-3xl">
            <h1
              data-page-hero-title
              className="text-[2rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
            >
              {title}
            </h1>
            {description ? (
              <p
                data-page-hero-desc
                className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
