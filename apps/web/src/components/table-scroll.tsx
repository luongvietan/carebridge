"use client";

import { useId, type ReactNode } from "react";
import { usePortalLocale } from "@/components/portal-locale";

/** A keyboard-focusable scroll region with a visible instruction on small screens. */
export function TableScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  const id = useId();
  const pt = usePortalLocale() === "pt-PT";
  const instruction = pt ? "Deslize horizontalmente para ver todas as colunas." : "Scroll horizontally to see all columns.";
  return (
    <div className={className}>
      <p id={id} className="border-b border-line bg-surface px-3 py-2 text-xs text-ink lg:sr-only">{instruction}</p>
      <div role="region" aria-label={pt ? "Tabela de dados" : "Data table"} aria-describedby={id} tabIndex={0} className="overflow-x-auto overscroll-x-contain">{children}</div>
    </div>
  );
}
