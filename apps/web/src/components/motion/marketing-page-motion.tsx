"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MarketingPageMotionProps = {
  children: ReactNode;
  smoothScroll?: boolean;
};

const REVEAL_FROM = { autoAlpha: 0, y: 28, force3D: true };
const REVEAL_TO = { autoAlpha: 1, y: 0, force3D: true };

export function MarketingPageMotion({
  children,
  smoothScroll = true,
}: MarketingPageMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      let lenis: Lenis | null = null;
      let tickerCallback: ((time: number) => void) | null = null;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (smoothScroll) {
          lenis = new Lenis({
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: false,
          });

          lenis.on("scroll", ScrollTrigger.update);

          tickerCallback = (time: number) => {
            lenis?.raf(time * 1000);
          };
          gsap.ticker.add(tickerCallback);
          gsap.ticker.lagSmoothing(0);

          ScrollTrigger.scrollerProxy(document.documentElement, {
            scrollTop(value) {
              if (arguments.length && value !== undefined) {
                lenis?.scrollTo(value, { immediate: true });
              }
              return lenis?.scroll ?? 0;
            },
            getBoundingClientRect() {
              return {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
              };
            },
            pinType: "transform",
          });

          ScrollTrigger.defaults({ scroller: document.documentElement });
          document.documentElement.classList.add("lenis", "lenis-smooth");
        }

        gsap.set("[data-reveal]", REVEAL_FROM);
        gsap.set("[data-reveal-child]", { autoAlpha: 0, y: 24, force3D: true });

        ScrollTrigger.batch("[data-reveal]", {
          start: "top 90%",
          once: true,
          onEnter: (elements) => {
            gsap.to(elements, {
              ...REVEAL_TO,
              duration: 0.75,
              stagger: 0.08,
              ease: "power2.out",
              overwrite: true,
            });
          },
        });

        ScrollTrigger.batch("[data-reveal-stagger]", {
          start: "top 88%",
          once: true,
          onEnter: (containers) => {
            containers.forEach((container) => {
              const children = container.querySelectorAll("[data-reveal-child]");
              if (!children.length) return;

              gsap.to(children, {
                autoAlpha: 1,
                y: 0,
                force3D: true,
                duration: 0.65,
                stagger: 0.1,
                ease: "power2.out",
                overwrite: true,
              });
            });
          },
        });

        const serviceCleanups: Array<() => void> = [];
        const serviceCards = containerRef.current?.querySelectorAll("[data-service-card]");
        serviceCards?.forEach((card) => {
          const image = card.querySelector("[data-service-image]");
          if (!image) return;

          const onEnter = () => {
            gsap.to(image, { scale: 1.05, duration: 0.4, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(image, { scale: 1, duration: 0.4, ease: "power2.out" });
          };

          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
          serviceCleanups.push(() => {
            card.removeEventListener("mouseenter", onEnter);
            card.removeEventListener("mouseleave", onLeave);
          });
        });

        const refreshLayout = () => ScrollTrigger.refresh();
        window.addEventListener("load", refreshLayout);
        requestAnimationFrame(refreshLayout);

        return () => {
          window.removeEventListener("load", refreshLayout);
          serviceCleanups.forEach((cleanup) => cleanup());
          if (tickerCallback) gsap.ticker.remove(tickerCallback);
          lenis?.destroy();
          document.documentElement.classList.remove("lenis", "lenis-smooth");
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          "[data-reveal], [data-reveal-child], [data-hero-badge], [data-hero-title], [data-hero-desc], [data-hero-cta], [data-hero-float]",
          { autoAlpha: 1, y: 0, x: 0, scale: 1 },
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef },
  );

  return <div ref={containerRef}>{children}</div>;
}
