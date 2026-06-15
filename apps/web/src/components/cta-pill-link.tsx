"use client";

import Link from "next/link";
import { useRef, type ComponentPropsWithoutRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight01Icon, Icon } from "@/components/ui/icon";

gsap.registerPlugin(useGSAP);

const variantStyles = {
  primary:
    "bg-gradient-to-r from-[#0c6e4f] to-[#7ed7a0] text-white hover:from-[#0a5c42] hover:to-[#6bc98f]",
  secondary: "bg-white text-[#0f261c] hover:bg-[#f5f7f6]",
} as const;

const iconStyles = {
  primary: "bg-white text-[#0c3a25]",
  secondary: "bg-gradient-to-r from-[#0c6e4f] to-[#7ed7a0] text-white",
} as const;

const shadowStyles = {
  sm: "shadow-sm",
  lg: "shadow-lg",
} as const;

type CtaPillLinkProps = {
  href: string;
  variant?: keyof typeof variantStyles;
  shadow?: keyof typeof shadowStyles;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className"> & {
    className?: string;
  };

export function CtaPillLink({
  href,
  children,
  variant = "primary",
  shadow = "sm",
  className = "",
  ...props
}: CtaPillLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const safe = contextSafe ?? ((fn: () => void) => fn);
      const mm = gsap.matchMedia();
      const link = linkRef.current;
      const icon = iconRef.current;
      if (!link || !icon) return;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const onEnter = safe(() => {
          gsap.to(link, { scale: 1.03, duration: 0.35, ease: "power2.out" });
          gsap.to(icon, { rotation: 45, scale: 1.1, duration: 0.4, ease: "back.out(1.6)" });
        });
        const onLeave = safe(() => {
          gsap.to(link, { scale: 1, duration: 0.35, ease: "power2.out" });
          gsap.to(icon, { rotation: 0, scale: 1, duration: 0.35, ease: "power2.out" });
        });

        link.addEventListener("mouseenter", onEnter);
        link.addEventListener("mouseleave", onLeave);

        return () => {
          link.removeEventListener("mouseenter", onEnter);
          link.removeEventListener("mouseleave", onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: linkRef },
  );

  return (
    <Link
      ref={linkRef}
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-full py-2.5 pl-5 pr-2 text-sm font-semibold transition sm:text-[15px] ${variantStyles[variant]} ${shadowStyles[shadow]} ${className}`}
      {...props}
    >
      {children}
      <span
        ref={iconRef}
        className={`grid h-8 w-8 place-items-center rounded-full ${iconStyles[variant]}`}
      >
        <Icon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
      </span>
    </Link>
  );
}
