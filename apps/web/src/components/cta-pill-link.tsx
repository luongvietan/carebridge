import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { ArrowUpRight01Icon, Icon } from "@/components/ui/icon";

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
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-full py-2.5 pl-5 pr-2 text-sm font-semibold transition sm:text-[15px] ${variantStyles[variant]} ${shadowStyles[shadow]} ${className}`}
      {...props}
    >
      {children}
      <span
        className={`grid h-8 w-8 place-items-center rounded-full transition group-hover:scale-105 ${iconStyles[variant]}`}
      >
        <Icon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
      </span>
    </Link>
  );
}
