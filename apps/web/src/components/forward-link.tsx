import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { ArrowRight01Icon, Icon } from "@/components/ui/icon";

type ForwardLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
  className?: string;
  children: React.ReactNode;
};

export function ForwardLink({ children, className = "", ...props }: ForwardLinkProps) {
  return (
    <Link
      className={`inline-flex items-center gap-1.5 font-semibold transition ${className}`}
      {...props}
    >
      {children}
      <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} aria-hidden />
    </Link>
  );
}
