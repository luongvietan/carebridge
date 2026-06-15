import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { ArrowRight01Icon, Icon } from "@/components/ui/icon";

type BackLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
  className?: string;
  children: React.ReactNode;
};

export function BackLink({ children, className = "", ...props }: BackLinkProps) {
  return (
    <Link
      className={`inline-flex items-center gap-2 text-sm font-medium transition ${className}`}
      {...props}
    >
      <Icon
        icon={ArrowRight01Icon}
        size={16}
        strokeWidth={2}
        className="rotate-180"
        aria-hidden
      />
      {children}
    </Link>
  );
}
